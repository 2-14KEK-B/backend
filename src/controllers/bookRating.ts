import validationMiddleware from "@middlewares/validation";
import HttpError from "@exceptions/Http";
import type { BookRating, CreateBookRating } from "@interfaces/book";
import type Controller from "@interfaces/controller";
import bookModel from "@models/book";
import userModel from "@models/user";
import isIdValid from "@utils/idChecker";
import { Router, Request, Response, NextFunction } from "express";
import { BookRatingDto } from "@validators/book";
import authenticationMiddleware from "@middlewares/authentication";
import { Types } from "mongoose";

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
    }

    private getAllBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            console.log(bookId);
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const bookRatings: BookRating[] | null = await this.book.findById(bookId, { _id: 0, ratings: 1 });
            if (!bookRatings) return next(new HttpError("Failed to get rating of the book"));
            res.json(bookRatings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId as string;
            console.log(userId);
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const book = await this.book.findById(bookId);

            const ratedAlready = book?.ratings?.find(rating => {
                console.log(rating);
                return rating.from_id.toString() === userId.toString();
            });
            if (ratedAlready) return next(new HttpError("Already rated this book."));

            const rateData: CreateBookRating = req.body;
            book?.ratings?.push({ ...rateData, from_id: new Types.ObjectId(userId) });

            const ratedBook = await book?.save();
            if (!ratedBook) return next(new HttpError("Failed to rate book"));

            const updatedUser = await this.user.findByIdAndUpdate(userId, { $push: { rated_books: book?._id } });
            console.log(updatedUser);
            if (!updatedUser) return next(new HttpError("Failed to update the user"));

            // // const rating = await this.book.updateOne({ _id: bookId }, { ...rateData, uploader: userId }, { returnDocument: "after" });

            res.json(book);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
