import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import validationMiddleware from "@middlewares/validation";
import authenticationMiddleware from "@middlewares/authentication";
import authorizationMiddleware from "@middlewares/authorization";
import bookModel from "@models/book";
import userModel from "@models/user";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import { BookRatingDto } from "@validators/book";
import HttpError from "@exceptions/Http";
import type { Book } from "@interfaces/book";
import type { BookRating, CreateBookRating } from "@interfaces/bookRating";
import type Controller from "@interfaces/controller";

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

            const bookRatings = await this.book.findById(bookId, { _id: 0, ratings: 1 }).lean<{ ratings: BookRating[] }>().exec();
            if (!bookRatings) return next(new HttpError("Failed to get rating of the book"));

            res.json(bookRatings.ratings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId as string;
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const book = await this.book.findOne({ _id: bookId, "ratings.from_id": userId }).lean<Book>().exec();
            if (book) return next(new HttpError("Already rated this book."));

            const rateData: CreateBookRating = req.body;
            const ratedBook = await this.book
                .findByIdAndUpdate(bookId, { $push: { ratings: { ...rateData, from_id: userId } } }, { returnDocument: "after" })
                .lean<Book>()
                .exec();
            if (!ratedBook) return next(new HttpError("Failed to rate book"));

            const updatedUser = await this.user.findByIdAndUpdate(userId, { $push: { rated_books: ratedBook?._id } }, { returnDocument: "after" });
            if (!updatedUser) return next(new HttpError("Failed to update the user"));

            res.json(ratedBook);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private deleteBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId as string;
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const book = await this.book.findOne({ _id: bookId, "ratings.from_id": userId }).lean<Book>().exec();
            if (!book) return next(new HttpError("You did not rate this book."));

            const { acknowledged } = await this.book.updateOne({ _id: bookId }, { $pull: { ratings: { from_id: new Types.ObjectId(userId) } } });

            if (!acknowledged) return next(new HttpError("Failed to delete book"));

            const updatedUser = await this.user.findByIdAndUpdate(userId, { $pull: { rated_books: book?._id } }, { returnDocument: "after" });
            if (!updatedUser) return next(new HttpError("Failed to update the user"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
