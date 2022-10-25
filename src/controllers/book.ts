import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import bookModel from "@models/book";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import IdNotValidException from "@exceptions/IdNotValid";
import Controller from "@interfaces/controller";
import Book from "@interfaces/book";
import authMiddleware from "@middlewares/auth";

export default class BookController implements Controller {
    path = "/books";
    router = Router();
    badRequest = StatusCode.BadRequest;
    private book = bookModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, authMiddleware, this.getAllBooks);
        this.router.get(`${this.path}/:id`, this.getBookById);
        this.router.post(this.path, authMiddleware, this.createBook);
        this.router.delete(`${this.path}/:id`, this.deleteBookById);
    }

    private getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const books = await this.book.find();
            res.send(books);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getBookById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bookId: string = req.params.id;
            if (!Types.ObjectId.isValid(bookId)) return next(new IdNotValidException(bookId));

            const book = await this.book.findById(bookId);
            if (!book) return next(new HttpError(`Failed to get book by id ${bookId}`));

            res.send(book);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private createBook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            const now = new Date();
            const bookData: Book = req.body;
            const newBook = await this.book.create({ ...bookData, created_on: now, updated_on: now });
            if (!newBook) return next(new HttpError("Failed to create book"));

            await this.user.findById(userId).update({ $push: { books: { _id: newBook._id } } });

            res.send(newBook);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteBookById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bookId: string = req.params.id;
            if (!Types.ObjectId.isValid(bookId)) return next(new IdNotValidException(bookId));

            const response = await this.book.findByIdAndDelete(bookId);
            if (!response) return next(new HttpError(`Failed to delete book by id ${bookId}`));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
