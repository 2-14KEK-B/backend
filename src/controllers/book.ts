import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import userModel from "@models/user";
import {
    // BookRatingDto,
    CreateBookDto,
    // ModifyBookDto,
} from "@validators/book";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type {
    // BookRating,
    CreateBook,
    // ModifyBook
} from "@interfaces/book";
import BookRatingController from "./bookRating";

export default class BookController implements Controller {
    path = "/book";
    router = Router();
    badRequest = StatusCode.BadRequest;
    private book = bookModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
        this.router.use(`${this.path}/:id/rate`, new BookRatingController().router);
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/all`, this.getAllBooks);
        this.router.get(this.path, authentication, this.getUserBooks);
        this.router.get(`${this.path}/:id`, authentication, this.getBookById);
        this.router.post(this.path, [authentication, validation(CreateBookDto)], this.createBook);
        // this.router.post(`${this.path}/:id/rate`, validation(BookRatingDto), this.createBookRating);
        // this.router.patch(`${this.path}/:id`, [authentication, validation(ModifyBookDto), true], this.modifyBookById);  VERSIONING NEEDED!!!!!!!!!!
        this.router.delete(`${this.path}/:id`, authentication, this.deleteBookById);
    }

    private getAllBooks = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const books = await this.book.find().lean();
            res.send(books);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserBooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user._id?.toString();
            if (!(await isIdValid(this.user, [userId], next))) return;

            const user = await this.user.findOne({ _id: userId }).populate("books").lean();
            if (!user) return next(new HttpError(`Failed to get user by id ${userId}`));

            res.send(user.books);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getBookById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const book = await this.book.findById(bookId).lean();
            if (!book) return next(new HttpError(`Failed to get book by id ${bookId}`));

            res.send(book);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createBook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            const bookData: CreateBook = req.body;
            const newBook = await this.book.create({ ...bookData, uploader: userId });
            if (!newBook) return next(new HttpError("Failed to create book"));

            await this.user.findByIdAndUpdate(userId, { $push: { books: { _id: newBook._id } } });

            res.send(newBook);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    // private createBookRating = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const userId = req.session.userId as string;
    //         const bookId = req.params["_id"];
    //         if (!(await isIdValid(this.book, [bookId], next))) return;

    //         const book = await this.book.findById(bookId);

    //         const ratedAlready = book?.ratings?.find(rating => {
    //             rating.from_id.toString() === userId.toString();
    //         });
    //         if (ratedAlready) return next(new HttpError("Already rated this book."));

    //         const rateData: BookRating = req.body;
    //         book?.ratings?.push({ ...rateData, from_id: userId });

    //         const ratedBook = await book?.save();
    //         if (!ratedBook) return next(new HttpError("Failed to rate book"));

    //         const updatedUser = await this.user.findByIdAndUpdate(userId, { $push: { rated_books: book?._id } });
    //         if (!updatedUser) return next(new HttpError("Failed to update the user"));

    //         // // const rating = await this.book.updateOne({ _id: bookId }, { ...rateData, uploader: userId }, { returnDocument: "after" });

    //         res.json(book);
    //     } catch (error) {
    //         next(new HttpError(error));
    //     }
    // };

    /**
    TODO: Versioning
     */
    // private modifyBookById = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const userId = req.session.userId;
    //         const bookId: string = req.params.id;
    //         if (!(await isIdValid(this.book, [bookId], next))) return;

    //         const now = new Date();
    //         const bookData: ModifyBook = req.body;
    //         const newBook = await this.book.findByIdAndUpdate(bookId, { ...bookData, updated_on: now }, { returnDocument: "after" });
    //         if (!newBook) return next(new HttpError("Failed to update book"));

    //         await this.user.findByIdAndUpdate(userId, { $push: { books: { _id: newBook._id } } });

    //         res.send(newBook);
    //     } catch (error) {
    //         next(new HttpError(error));
    //     }
    // };

    private deleteBookById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const response = await this.book.findByIdAndDelete(bookId);
            if (!response) return next(new HttpError(`Failed to delete book by id ${bookId}`));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
