import HttpError from "@exceptions/Http";
import isIdValid from "@utils/idChecker";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router, Request, Response, NextFunction } from "express";
import type Controller from "@interfaces/controller";
// import bookRatingModel from "@models/bookRating";
// import type { BookRating } from "@interfaces/bookRating";
// import userModel from "@models/user";
import bookModel from "@models/book";

export default class BookRatingController implements Controller {
    public path = "/rate";
    public router = Router({ mergeParams: true });
    // private user = userModel;
    private book = bookModel;
    // private bookRating = bookRatingModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(this.path, this.getRatesByBookId);
        // this.router.post(this.path, this.createBookRateByBookId);
        // this.router.delete(this.path, this.deleteBookRateByBookId);
    }

    private getRatesByBookId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;
            const book = await this.book.findById(bookId).populate("ratings").exec();
            console.log(book?.ratings);
            res.send(book?.ratings);
        } catch (error) {
            console.log(error);
            next(new HttpError(error.message));
        }
    };

    // private createBookRateByBookId = async (req: Request, res: Response, next: NextFunction) => {
    //     console.log("create");
    // };
    // private deleteBookRateByBookId = async (req: Request, res: Response, next: NextFunction) => {
    //     console.log("delete");
    // };

    // private rateBook = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const userId = req.session.userId;
    //         if (!userId) return;
    //         const bookId = req.params["id"];

    //         if (!(await isIdValid(this.book, [bookId], next))) return;

    //         const book = await this.book.findById(bookId);
    //         if (book?.ratings?.some(rate => rate.fromid.toString() == userId?.toString())) return next(new HttpError("Already rated this book."));

    //         const rateData: BookRating = req.body;
    //         const newRate = await this.bookRating.create(rateData);

    //         book?.ratings?.push({ ...rateData, fromid: userId });

    //         const ratedBook = await book?.save();
    //         // const rating = await this.book.updateOne({ id: bookId }, { ...rateData, uploader: userId }, { returnDocument: "after" });

    //         if (!ratedBook) return next(new HttpError("Failed to rate book"));

    //         await this.user.findByIdAndUpdate(userId, { $push: { books: { id: rating.id } } });

    //         res.send(ratedBook);
    //     } catch (error) {
    //         next(new HttpError(error));
    //     }
    // };
}
