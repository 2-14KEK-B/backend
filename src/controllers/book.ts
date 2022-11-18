import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import userModel from "@models/user";
import {
    BookRatingDto,
    CreateBookDto,
    // ModifyBookDto,
} from "@validators/book";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type {
    Book,
    BookRating,
    CreateBook,
    // ModifyBook
} from "@interfaces/book";
import { Types } from "mongoose";
import type { User } from "@interfaces/user";

export default class BookController implements Controller {
    path = "/book";
    router = Router();
    badRequest = StatusCode.BadRequest;
    private book = bookModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/all`, this.getAllBooks);
        this.router.get(this.path, authentication, this.getUserBooks);
        this.router.get(`${this.path}/:id`, authentication, this.getBookById);
        this.router.post(`${this.path}/rate/:id`, validation(BookRatingDto), this.rateBook);
        this.router.post(this.path, [authentication, validation(CreateBookDto)], this.createBook);
        // this.router.patch(`${this.path}/:id`, [authentication, validation(ModifyBookDto), true], this.modifyBookById);  VERSIONING NEEDED!!!!!!!!!!
        this.router.delete(`${this.path}/:id`, authentication, this.deleteBookById);
    }

    private getAllBooks = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const books = await this.book.find().lean<Book[]>().exec();
            res.send(books);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserBooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;

            const user = await this.user.findOne({ _id: userId }).populate("books").lean<User>().exec();
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

            const book = await this.book.findById(bookId).lean<Book>().exec();
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

            await this.user.findByIdAndUpdate(userId, { $push: { books: { _id: newBook._id } } }).exec();

            res.send(newBook);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private rateBook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            if (!userId) return;
            const bookId = req.params["_id"];

            if (!(await isIdValid(this.book, [bookId], next))) return;

            const book = await this.book.findById(bookId);
            if (book?.ratings?.some(rate => rate.from_id.toString() == userId?.toString())) return next(new HttpError("Already rated this book."));

            const rateData: BookRating = req.body;
            book?.ratings?.push({ ...rateData, from_id: userId });

            const ratedBook = await book?.save();
            // const rating = await this.book.updateOne({ _id: bookId }, { ...rateData, uploader: userId }, { returnDocument: "after" });

            if (!ratedBook) return next(new HttpError("Failed to rate book"));

            // await this.user.findByIdAndUpdate(userId, { $push: { books: { _id: rating._id } } });

            res.send(ratedBook);
        } catch (error) {
            next(new HttpError(error));
        }
    };

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
            const userId = req.session.userId;

            const bookId = req.params["id"];
            if (!bookId) return;
            if (!(await isIdValid(this.book, [bookId], next))) return;

            const loggedUser = await this.user.findById(userId).lean<User>().exec();

            if (loggedUser.role != "admin") {
                if (!loggedUser.books.find(id => id.toString() === bookId)) {
                    return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
                }
            }

            const bookRes = await this.book.findByIdAndDelete(bookId).lean<Book>().exec();
            if (!bookRes) return next(new HttpError(`Failed to delete book by id ${bookId}`));

            const userRes = await this.user.findByIdAndUpdate(new Types.ObjectId(bookRes?.uploader), { $pull: { books: bookRes?._id } }).exec();
            if (!userRes) return next(new HttpError(`Failed to update user`));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
