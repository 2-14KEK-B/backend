import { Router, Request, Response, NextFunction } from "express";
import BookRatingController from "./bookRating";
import authorizationMiddleware from "@middlewares/authorization";
import authentication from "@middlewares/authentication";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import userModel from "@models/user";
import { CreateBookDto } from "@validators/book";
import getPaginated from "@utils/getPaginated";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type { FilterQuery, Types, SortOrder } from "mongoose";
import type Controller from "@interfaces/controller";
import type { Book, CreateBook } from "@interfaces/book";

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
            .route(`${this.path}/:id([0-9a-fA-F]{24})`)
            .get(this.getBookById)
            // .patch(`${this.path}/:id`, [authentication, validation(ModifyBookDto), true], this.modifyBookById),
            .delete(authentication, this.deleteBookById);
    }

    private getAllBooks = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const books = await this.book //
                .find()
                .lean<Book[]>()
                .exec();

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
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
                available?: string;
                keyword?: string;
                userId?: string;
            }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, sortBy, available, keyword, userId } = req.query;

            let query: FilterQuery<Book> = {};
            if (available || userId || keyword) {
                query = { $and: [] };
                if (available) {
                    query.$and?.push({ available: available == "true" });
                } else if (userId) {
                    if (await isIdNotValid(this.user, [userId], next)) return;
                    query.$and?.push({ uploader: userId });
                } else if (keyword) {
                    const regex = new RegExp(keyword, "i");

                    query.$and?.push({
                        $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }],
                    });
                }
            }

            const books = await getPaginated(this.book, query, skip, limit, sort, sortBy);

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private getUserBooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];

            const books = await this.book //
                .find({ uploader: userId })
                .lean<Book[]>()
                .exec();
            if (!books) return next(new HttpError(`Failed to get user by id ${userId}`));

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
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

            res.json(book);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private createBook = async (req: Request<unknown, CreateBook>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            const newBook = await this.book //
                .create({ ...req.body, uploader: userId });
            if (!newBook) return next(new HttpError("Failed to create book"));

            const { acknowledged } = await this.user //
                .updateOne(
                    { _id: userId },
                    {
                        $push: { books: { _id: newBook._id } },
                    },
                )
                .exec();
            if (!acknowledged) return next(new HttpError(`Failed to update user`));

            res.json(newBook);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    /**
    TODO: Versioning
     */
    // private modifyBookById = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const userId = req.session["userId"];
    //         const bookId: string = req.params["id"];
    //         if (await isIdNotValid(this.book, [bookId], next)) return;

    //         const now = new Date();
    //         const bookData: ModifyBook = req.body;
    //         const newBook = await this.book.findByIdAndUpdate(bookId, { ...bookData, updated_on: now }, { returnDocument: "after" });
    //         if (!newBook) return next(new HttpError("Failed to update book"));

    //         await this.user.findByIdAndUpdate(userId, { $push: { books: { _id: newBook._id } } });

    //         res.json(newBook);
    //     } catch (error) {
    //         next(new HttpError(error.message));
    //     }
    // };

    private deleteBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const { uploader } = await this.book //
                .findById(bookId)
                .lean<{ uploader: Types.ObjectId }>()
                .exec();

            if (req.session["role"] != "admin") {
                if (uploader.toString() != userId) {
                    return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
                }
            }

            const { acknowledged: successfullDeleteBook } = await this.book.deleteOne({ _id: bookId }).exec();
            if (!successfullDeleteBook) return next(new HttpError(`Failed to delete book by id ${bookId}`));

            const { acknowledged: successfullDeleteBookFromUser } = await this.user //
                .updateOne({ _id: uploader }, { $pull: { books: bookId } })
                .exec();
            if (!successfullDeleteBookFromUser) return next(new HttpError(`Failed to update user`));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
