import { Router, Request, Response, NextFunction } from "express";
import validationMiddleware from "@middlewares/validation";
import authenticationMiddleware from "@middlewares/authentication";
import authorizationMiddleware from "@middlewares/authorization";
import bookModel from "@models/book";
import userModel from "@models/user";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import { CreateBookRateDto, ModifyBookRateDto } from "@validators/book";
import HttpError from "@exceptions/Http";
import type { Book } from "@interfaces/book";
import type Controller from "@interfaces/controller";
import type { BookRate, CreateBookRate, ModifyBookRate } from "@interfaces/bookRate";

export default class BookRateController implements Controller {
    router = Router();
    book = bookModel;
    user = userModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router
            .route(`/book/:bookId([0-9a-fA-F]{24})/rate/:rateId([0-9a-fA-F]{24})`)
            .all(authenticationMiddleware)
            .patch(validationMiddleware(ModifyBookRateDto, true), this.modifyBookRateByBookAndRateId)
            .delete(this.deleteBookRateByBookAndRateId);
        this.router
            .route(`/book/:id([0-9a-fA-F]{24})/rate`)
            .get(this.getBookRatesByBookId)
            .post([authenticationMiddleware, validationMiddleware(CreateBookRateDto)], this.createBookRateByBookId);
        // ADMIN
        this.router
            .route("/admin/book/:id([0-9a-fA-F]{24})/rate/:rateId([0-9a-fA-F]{24})")
            .all([authenticationMiddleware, authorizationMiddleware(["admin"])])
            .patch(validationMiddleware(ModifyBookRateDto, true), this.adminModifyBookRateByBookAndRateId)
            .delete(this.adminDeleteBookRateByBookAndRateId);
    }

    private getBookRatesByBookId = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const { rates } = await this.book
                .findById(bookId, { rates: 1 })
                // .populate({ path: "from", select: "email username fullname picture" })
                .lean<{ rates: BookRate[] }>()
                .exec();
            if (!rates) return next(new HttpError("error.bookRate.failedGetBookRates"));

            res.json(rates);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    private createBookRateByBookId = async (
        req: Request<{ id: string }, unknown, CreateBookRate>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.session["userId"];
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const alreadyRated = await this.book //
                .exists({ _id: bookId, "rates.from": userId })
                .exec();
            if (alreadyRated) return next(new HttpError("error.bookRate.alreadyRatedBook"));

            const ratedBook = await this.book
                .findByIdAndUpdate(bookId, { $push: { rates: { ...req.body, from: userId } } }, { new: true })
                .populate({ path: "uploader", select: "username fullname email picture" })
                .populate({ path: "rates.from", select: "username fullname email picture" })
                .lean<Book>()
                .exec();
            if (!ratedBook) return next(new HttpError("error.bookRate.failedCreateBookRate"));

            const { modifiedCount } = await this.user //
                .updateOne({ _id: userId }, { $push: { rated_books: ratedBook._id } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("error.user.failedUpdateUser"));

            res.json(ratedBook);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private modifyBookRateByBookAndRateId = async (
        req: Request<{ bookId: string; rateId: string }, unknown, ModifyBookRate>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { bookId, rateId } = req.params;
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const userId = req.session["userId"];

            const { rate: newRate, comment: newComment } = req.body;

            const bookWithRate = await this.book
                .findOne({ _id: bookId, "rates._id": rateId, "rates.from": userId })
                .exec();
            if (bookWithRate == null) return next(new HttpError("error.bookRate.notHaveBookRate"));

            if (bookWithRate.rates && bookWithRate.rates.length > 0) {
                const modifiableRate = bookWithRate.rates.find(rate => rate._id?.toString() == rateId);
                if (modifiableRate) {
                    if (newRate) {
                        modifiableRate.rate = newRate;
                    }
                    if (newComment) {
                        modifiableRate.comment = newComment;
                    }
                    const updatedBook = await bookWithRate.save();
                    res.json(
                        await updatedBook.populate([
                            { path: "uploader", select: "username fullname email picture" },
                            { path: "rates.from", select: "username fullname email picture" },
                        ]),
                    );
                }
            } else {
                return next(new HttpError("error.bookRate.failedUpdateBookRate"));
            }
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private deleteBookRateByBookAndRateId = async (
        req: Request<{ bookId: string; rateId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { bookId, rateId } = req.params;
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const userId = req.session["userId"];

            const bookWithRate = await this.book
                .exists({ _id: bookId, "rates._id": rateId, "rates.from": userId })
                .exec();

            if (bookWithRate == null) return next(new HttpError("error.bookRate.notHaveBookRate"));

            const { modifiedCount: modifiedBookCount } = await this.book
                .updateOne(
                    { _id: bookId, "rates._id": rateId, "rates.from": userId },
                    { $pull: { rates: { _id: rateId } } },
                )
                .exec();
            if (modifiedBookCount != 1) return next(new HttpError("error.bookRate.failedDeleteBookRate"));

            const { modifiedCount: modifiedUserCount } = await this.user
                .updateOne(
                    { _id: userId },
                    {
                        $pull: { rated_books: bookId },
                    },
                )
                .exec();
            if (modifiedUserCount != 1) return next(new HttpError("error.user.failedUpdateUser"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    // ADMIN
    private adminModifyBookRateByBookAndRateId = async (
        req: Request<{ id: string; rateId: string }, unknown, ModifyBookRate>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const rateId = req.params["rateId"];

            const { rate, comment } = req.body;

            const bookWithRate = await this.book.findOne({ _id: bookId, "rates._id": rateId }).exec();

            if (bookWithRate == null) return next(new HttpError("error.bookRate.notContainBookRate"));

            if (bookWithRate.rates && bookWithRate.rates[0]) {
                if (rate) {
                    bookWithRate.rates[0].rate = rate;
                }
                if (comment) {
                    bookWithRate.rates[0].comment = comment;
                }
                const updatedBook = await bookWithRate.save();
                res.json(updatedBook);
            } else {
                return next(new HttpError("error.bookRate.failedUpdateBookRate"));
            }
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private adminDeleteBookRateByBookAndRateId = async (
        req: Request<{ id: string; rateId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const rateId = req.params["rateId"];

            const bookWithRate = await this.book //
                .findOne({ _id: bookId, "rates._id": rateId })
                .lean<{ rates: BookRate[] } & Book>()
                .exec();
            if (bookWithRate == null) return next(new HttpError("error.bookRate.notContainBookRate"));

            const fromId = bookWithRate.rates[0]?.from.toString();

            const { modifiedCount: modifiedBookCount } = await this.book
                .updateOne({ _id: bookId }, { $pull: { rates: { from: fromId } } })
                .exec();
            if (modifiedBookCount != 1) return next(new HttpError("error.bookRate.failedDeleteBookRate"));

            const { modifiedCount: modifiedUserCount } = await this.user
                .updateOne({ _id: fromId }, { $pull: { rated_books: bookId } })
                .exec();
            if (modifiedUserCount != 1) return next(new HttpError("error.user.failedUpdateUser"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
