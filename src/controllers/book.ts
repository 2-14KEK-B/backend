import { Router, Request, Response, NextFunction } from "express";
import BookRatingController from "./bookRating";
import authorizationMiddleware from "@middlewares/authorization";
import authentication from "@middlewares/authentication";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import userModel from "@models/user";
import { CreateBookDto } from "@validators/book";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import { FilterQuery, Types, SortOrder } from "mongoose";
import type Controller from "@interfaces/controller";
import type { Book, CreateBook } from "@interfaces/book";
import type { User } from "@interfaces/user";

export default class BookController implements Controller {
    path = "/book";
    router = Router();
    private book = bookModel;
    private user = userModel;

    constructor() {
        this.router.use(`${this.path}/rate`, new BookRatingController().router);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/all`, [authentication, authorizationMiddleware(["admin"])], this.getAllBooks);
        this.router.get(`${this.path}/me`, authentication, this.getUserBooks);
        this.router
            .route(this.path)
            .get(this.getBooks)
            .post([authentication, validation(CreateBookDto)], this.createBook);
        this.router
            .route(`${this.path}/:id`)
            .get(authentication, this.getBookById)
            // .patch(`${this.path}/:id`, [authentication, validation(ModifyBookDto), true], this.modifyBookById),
            .delete(authentication, this.deleteBookById);
    }

    private getAllBooks = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const books = await this.book //
                .find()
                .lean<Book[]>()
                .exec();

            res.send(books);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getBooks = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            {
                skip?: string;
                limit?: string;
                sort?: SortOrder;
                sortBy?: string;
                keyword?: string;
            }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, sortBy, keyword } = req.query;

            let query: FilterQuery<Book> = {};
            let sortQuery: { [_ in keyof Partial<Book>]: SortOrder } | string = {
                createdAt: sort,
            };

            if (keyword) {
                const regex = new RegExp(keyword, "i");

                query = {
                    $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }],
                };
            }

            if (sort && sortBy) {
                sortQuery = `${sort == "asc" ? "" : "-"}${sortBy}`;
            }

            const books = await this.book //
                .find(query)
                .sort(sortQuery)
                .skip(Number.parseInt(skip as string) || 0)
                .limit(Number.parseInt(limit as string) || 10)
                .lean<Book[]>()
                .exec();

            res.json(books);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserBooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;

            const user = await this.user //
                .findOne({ _id: userId })
                .populate("books")
                .lean<User>()
                .exec();
            if (!user) return next(new HttpError(`Failed to get user by id ${userId}`));

            res.send(user.books);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const book = await this.book //
                .findById(bookId)
                .lean<Book>()
                .exec();
            if (!book) return next(new HttpError(`Failed to get book by id ${bookId}`));

            res.send(book);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createBook = async (req: Request<unknown, CreateBook>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            const newBook = await this.book //
                .create({ ...req.body, uploader: userId });
            if (!newBook) return next(new HttpError("Failed to create book"));

            const userRes = await this.user //
                .findByIdAndUpdate(userId, {
                    $push: { books: { _id: newBook._id } },
                })
                .lean<User>()
                .exec();
            if (!userRes) return next(new HttpError(`Failed to update user`));

            res.send(newBook);
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
    //         if (await isIdNotValid(this.book, [bookId], next)) return;

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

    private deleteBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const { role, books } = await this.user //
                .findById(userId, { role: 1, books: 1 })
                .lean<Partial<User>>()
                .exec();

            if (role != "admin") {
                if (!books?.find(id => id.valueOf() === bookId)) {
                    return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
                }
            }

            const { _id, uploader } = await this.book //
                .findByIdAndDelete(bookId)
                .lean<Book>()
                .exec();
            if (!_id) return next(new HttpError(`Failed to delete book by id ${bookId}`));

            const userRes = await this.user
                .findByIdAndUpdate(
                    new Types.ObjectId(uploader), //
                    { $pull: { books: _id } },
                )
                .lean<User>()
                .exec();
            if (!userRes) return next(new HttpError(`Failed to update user`));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
