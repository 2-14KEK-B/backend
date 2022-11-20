import validationMiddleware from "@middlewares/validation";
import HttpError from "@exceptions/Http";
import type { BookRating, CreateBookRating } from "@interfaces/bookRating";
import type Controller from "@interfaces/controller";
import bookModel from "@models/book";
import userModel from "@models/user";
import isIdValid from "@utils/idChecker";
import { Router, Request, Response, NextFunction } from "express";
import { BookRatingDto } from "@validators/book";
import authenticationMiddleware from "@middlewares/authentication";
import { Types } from "mongoose";
import authorizationMiddleware from "@middlewares/authorization";
import StatusCode from "@utils/statusCodes";

export default class BookRatingController implements Controller {
    path = "/";
    router = Router({ mergeParams: true });
    book = bookModel;
    user = userModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(this.path, this.getAllBookRatingByBookId);
        this.router.post(this.path, [authenticationMiddleware, validationMiddleware(BookRatingDto)], this.createBookRatingByBookId);
        this.router.delete(this.path, [authenticationMiddleware, authorizationMiddleware(["admin"])], this.deleteBookRatingByBookId);
    }

    private getAllBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const bookRatings = await this.book.findById(bookId, { ratings: 1 }).lean<BookRating[]>().exec();
            if (!bookRatings) return next(new HttpError("Failed to get rating of the book"));
            res.json(bookRatings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId as string;
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const book = await this.book.findById(bookId).exec();

            const ratedAlready = book?.ratings?.find(rate => isUsersRate(rate, userId));
            if (ratedAlready) return next(new HttpError("Already rated this book."));

            const rateData: CreateBookRating = req.body;
            book?.ratings?.push({ ...rateData, from_id: new Types.ObjectId(userId) });
            // console.log("book?.ratings?: ", book?.ratings);

            const ratedBook = await book?.save();
            // console.log("ratedBook: ", ratedBook);
            if (!ratedBook) return next(new HttpError("Failed to rate book"));

            const updatedUser = await this.user.findByIdAndUpdate(userId, { $push: { rated_books: book?._id } }, { returnDocument: "after" });
            // console.log(updatedUser);
            if (!updatedUser) return next(new HttpError("Failed to update the user"));

            // // const rating = await this.book.updateOne({ _id: bookId }, { ...rateData, uploader: userId }, { returnDocument: "after" });

            res.json(book);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private deleteBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId as string;
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const book = await this.book.findById(bookId).exec();

            const rated = book?.ratings?.find(rate => isUsersRate(rate, userId));
            if (!rated) return next(new HttpError("You did not rate this book."));

            const { acknowledged } = await this.book.updateOne({ _id: bookId }, { $pull: { ratings: { from_id: new Types.ObjectId(userId) } } });

            // book?.ratings?.filter((rate, _index, arr) => {
            //     arr.pop();
            //     return rate.from_id.valueOf() === userId;
            // });
            // console.log("book?.ratings? after delete: ", book?.ratings);

            // const bookWithDeletedRate = await book?.save();
            // console.log("bookWithDeletedRate: ", bookWithDeletedRate);
            if (!acknowledged) return next(new HttpError("Failed to delete book"));

            const updatedUser = await this.user.findByIdAndUpdate(userId, { $pull: { rated_books: book?._id } }, { returnDocument: "after" });
            // console.log(updatedUser);
            if (!updatedUser) return next(new HttpError("Failed to update the user"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}

function isUsersRate(rate: BookRating, userId: string) {
    const users = rate.from_id.valueOf() === userId;
    console.log(users);
    return users;
}
