import { Router, Request, Response, NextFunction } from "express";
import validationMiddleware from "@middlewares/validation";
import authenticationMiddleware from "@middlewares/authentication";
import authorizationMiddleware from "@middlewares/authorization";
import bookModel from "@models/book";
import userModel from "@models/user";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import { BookRatingDto } from "@validators/book";
import HttpError from "@exceptions/Http";
import { SortOrder, Types } from "mongoose";
import type { Book } from "@interfaces/book";
import type Controller from "@interfaces/controller";
import type { BookRating, CreateOrModifyBookRating } from "@interfaces/bookRating";

export default class BookRatingController implements Controller {
    path = "/";
    router = Router();
    book = bookModel;
    user = userModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router
            .route(`${this.path}:bookId([0-9a-fA-F]{24})/:rateId([0-9a-fA-F]{24})`)
            .patch([authenticationMiddleware, validationMiddleware(BookRatingDto, true)], this.modifyBookRating)
            .delete([authenticationMiddleware, authorizationMiddleware(["admin"])], this.deleteBookRating);
        this.router
            .route(`${this.path}:id([0-9a-fA-F]{24})`)
            .get(this.getBookRatingByBookId)
            .post([authenticationMiddleware, validationMiddleware(BookRatingDto)], this.createBookRatingByBookId)
            .delete(authenticationMiddleware, this.deleteBookRatingByBookId);
    }

    private getBookRatingByBookId = async (
        req: Request<{ id: string }, unknown, unknown, { skip?: string; limit?: string; sort?: SortOrder }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const { skip, limit, sort } = req.query;

            const skipAsNum = Number.parseInt(skip as string) || 0,
                limitAsNum = Number.parseInt(limit as string) || 1,
                sortAsNum = sort == "asc" ? 1 : -1 || 1;

            const ratings = await this.book
                .aggregate<{ docs: BookRating[]; count: number }>([
                    { $match: { _id: new Types.ObjectId(bookId) } },
                    {
                        $project: {
                            _id: 0,
                            docs: {
                                $slice: [
                                    {
                                        $sortArray: {
                                            input: "$ratings",
                                            sortBy: {
                                                createdAt: sortAsNum,
                                            },
                                        },
                                    },
                                    skipAsNum,
                                    limitAsNum,
                                ],
                            },
                            totalDocs: { $size: "$ratings" },
                        },
                    },
                ])
                .exec();

            if (ratings[0]) {
                res.json(ratings[0]);
            } else {
                res.json({ docs: [], count: 0 });
            }
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private createBookRatingByBookId = async (
        req: Request<{ id: string }, unknown, CreateOrModifyBookRating>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.session["userId"];
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const alreadyRated = await this.book //
                .exists({ _id: bookId, "ratings.from_id": userId })
                .exec();
            if (alreadyRated) return next(new HttpError("Already rated this book"));

            const ratedBook = await this.book
                .findByIdAndUpdate(
                    bookId,
                    { $push: { ratings: { ...req.body, from_id: userId } } },
                    { returnDocument: "after" },
                )
                .lean<Book>()
                .exec();
            if (!ratedBook) return next(new HttpError("Failed to rate book"));

            const { acknowledged } = await this.user //
                .updateOne({ _id: userId }, { $push: { rated_books: ratedBook._id } })
                .exec();
            if (!acknowledged) return next(new HttpError("Failed to update the user"));

            res.json(ratedBook);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private modifyBookRating = async (
        req: Request<{ bookId: string; rateId: string }, unknown, CreateOrModifyBookRating>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.session["userId"];
            const { bookId, rateId } = req.params;
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const alreadyRated = await this.book //
                .exists({ _id: bookId, "ratings.from_id": userId, "ratings._id": rateId })
                .exec();
            if (!alreadyRated) return next(new HttpError("You don't have rate for this book"));

            const ratedBook = await this.book
                .findOneAndUpdate(
                    { _id: bookId, "ratings._id": rateId },
                    {
                        $set: {
                            "ratings.$.rate": req.body.rate,
                            "ratings.$.comment": req.body.comment,
                        },
                    },
                    { returnDocument: "after" },
                )
                .exec();

            if (!ratedBook) return next(new HttpError("Failed to update book rating"));

            res.json(ratedBook);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private deleteBookRatingByBookId = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const ratedBook = await this.book //
                .exists({ _id: bookId, "ratings.from_id": userId })
                .exec();
            if (!ratedBook) return next(new HttpError("You did not rate this book."));

            const { acknowledged: successfullBookUpdate } = await this.book
                .updateOne({ _id: bookId }, { $pull: { ratings: { from_id: userId } } })
                .exec();
            if (!successfullBookUpdate) return next(new HttpError("Failed to delete book"));

            const { acknowledged: successfullUserUpdate } = await this.user
                .updateOne({ _id: userId }, { $pull: { rated_books: bookId } })
                .exec();
            if (!successfullUserUpdate) return next(new HttpError("Failed to update the user"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private deleteBookRating = async (
        req: Request<{ bookId: string; rateId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { bookId, rateId } = req.params;

            if (await isIdNotValid(this.book, [bookId], next)) return;

            const bookWithRate = await this.book
                .findOneAndUpdate({ _id: bookId, "ratings._id": rateId }, { $pull: { ratings: { _id: rateId } } })
                .select({ ratings: { $elemMatch: { _id: rateId } } })
                .lean<{ ratings: BookRating[] }>()
                .exec();
            if (!bookWithRate) return next(new HttpError("Failed to delete rating from book"));

            const { acknowledged } = await this.user
                .updateOne(
                    { _id: bookWithRate.ratings[0]?.from_id },
                    {
                        $pull: { rated_books: bookId },
                    },
                )
                .exec();
            if (!acknowledged) return next(new HttpError("Failed to update user"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
