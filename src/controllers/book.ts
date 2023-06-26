import { Router, type Request, type Response, type NextFunction } from "express";
import { BookRateController } from "@controllers";
import {
    authenticationMiddleware as authentication,
    authorizationMiddleware as authorization,
    validationMiddleware as validation,
} from "@middlewares";
import { bookModel, userModel } from "@models";
import { CreateBookDto, ModifyBookDto } from "@validators";
import { getPaginated, isIdNotValid, StatusCode } from "@utils";
import { HttpError } from "@exceptions";
import type { FilterQuery, Types, SortOrder } from "mongoose";
import type { Controller, Book, CreateBook, ModifyBook } from "@interfaces";

export default class BookController implements Controller {
    router = Router();
    private book = bookModel;
    private user = userModel;

    constructor() {
        this.router.use("/", new BookRateController().router);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`/book/borrow`, this.getBooksForBorrow);
        this.router.get(`/book/lend`, this.getBooksForLend);
        this.router.get(`/user/me/book`, authentication, this.getLoggedInUserBooks);
        this.router.post("/book", [authentication, validation(CreateBookDto)], this.createBook);
        this.router
            .route(`/book/:id([0-9a-fA-F]{24})`)
            .get(this.getBookById)
            .patch([authentication, validation(ModifyBookDto, true)], this.modifyBookById)
            .delete(authentication, this.deleteBookById);
        // ADMIN
        this.router.get("/admin/book", [authentication, authorization(["admin"])], this.adminGetBooks);
        this.router
            .route("/admin/book/:id([0-9a-fA-F]{24})")
            .all([authentication, authorization(["admin"])])
            .patch(this.adminModifyBookById)
            .delete(this.adminDeleteBookById);
    }

    private getBooksForBorrow = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            { skip: string; limit: string; sort: "asc" | "desc"; keyword?: string; genre?: string }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, keyword, genre } = req.query;

            const query: FilterQuery<Book> = { $and: [{ available: true }, { for_borrow: true }] };
            if (keyword) {
                const regex = new RegExp(keyword, "i");

                query.$and?.push({
                    $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }, { isbn: { $regex: regex } }],
                });
            }
            if (genre) {
                const genreQuery = genre.split(",");

                query.$and?.push({
                    category: { $all: genreQuery },
                });
            }

            const books = await getPaginated(this.book, query, skip, limit, sort);
            if (!books) return next(new HttpError("error.book.failedGetBooks"));

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private getBooksForLend = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            { skip: string; limit: string; sort: "asc" | "desc"; keyword?: string; genre?: string }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, keyword, genre } = req.query;

            const query: FilterQuery<Book> = { $and: [{ available: true }, { for_borrow: false }] };
            if (keyword) {
                const regex = new RegExp(keyword, "i");

                query.$and?.push({
                    $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }, { isbn: { $regex: regex } }],
                });
            }
            if (genre) {
                const genreQuery = genre.split(",");

                query.$and?.push({
                    category: { $all: genreQuery },
                });
            }

            const books = await getPaginated(this.book, query, skip, limit, sort);
            if (!books) return next(new HttpError("error.book.failedGetBooks"));

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private getBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const book = await this.book //
                .findById(bookId)
                .populate({ path: "uploader", select: "username fullname email picture" })
                .populate({ path: "rates.from", select: "username fullname email picture" })
                .lean<Book>()
                .exec();
            if (!book) return next(new HttpError("error.book.failedGetBookById"));

            res.json(book);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    private getLoggedInUserBooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];

            const books = await this.book //
                .find({ uploader: userId })
                .lean<Book[]>()
                .exec();
            if (!books) return next(new HttpError("error.book.failedGetBooks"));

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private createBook = async (req: Request<unknown, CreateBook>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            // const newBook = await this.book //
            //     .create([{ ...req.body, uploader: userId }], { validateBeforeSave: true });

            const newBook = new this.book({ ...req.body, uploader: userId });
            await newBook.save({ validateBeforeSave: true });
            if (!newBook) return next(new HttpError("error.book.failedCreateBook"));

            const { modifiedCount } = await this.user //
                .updateOne(
                    { _id: userId },
                    {
                        $push: { books: { _id: newBook._id } },
                    },
                )
                .exec();
            if (modifiedCount != 1) return next(new HttpError("error.user.failedUpdateUser"));

            res.json(newBook);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private modifyBookById = async (
        req: Request<{ id: string }, unknown, ModifyBook>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const userId = req.session["userId"];

            const now = new Date();
            const modifiedBook = await this.book //
                .findOneAndUpdate(
                    { _id: bookId, uploader: userId },
                    { ...req.body, updated_on: now },
                    { new: true, runValidators: true },
                )
                .lean<Book>()
                .exec();
            if (!modifiedBook) return next(new HttpError("error.book.failedUpdateBook"));

            res.json(modifiedBook);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private deleteBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const loggedInUserId = req.session["userId"];

            const { deletedCount } = await this.book.deleteOne({ _id: bookId, uploader: loggedInUserId }).exec();
            if (deletedCount != 1) return next(new HttpError("error.book.failedDeleteBook"));

            const { modifiedCount } = await this.user //
                .updateOne({ _id: loggedInUserId }, { $pull: { books: bookId } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("error.user.failedUpdateUser"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    // ADMIN
    private adminGetBooks = async (
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
            if (keyword) {
                const regex = new RegExp(keyword, "i");

                query = {
                    $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }, { isbn: { $regex: regex } }],
                };
            }

            const books = await getPaginated(this.book, query, skip, limit, sort, sortBy);
            if (!books) return next(new HttpError("error.book.failedGetBooks"));

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private adminModifyBookById = async (
        req: Request<{ id: string }, unknown, ModifyBook>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const bookId: string = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const now = new Date();
            const modifiedBook = await this.book //
                .findByIdAndUpdate(bookId, { ...req.body, updatedAt: now }, { new: true, runValidators: true })
                .lean<Book>()
                .exec();
            if (!modifiedBook) return next(new HttpError("error.book.failedUpdateBook"));

            res.json(modifiedBook);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private adminDeleteBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const user = await this.book //
                .findById(bookId)
                .lean<{ uploader: Types.ObjectId }>()
                .exec();
            if (user == null) return;
            const { uploader } = user;

            const { deletedCount } = await this.book //
                .deleteOne({ _id: bookId })
                .exec();
            if (deletedCount != 1) return next(new HttpError("error.book.failedDeleteBook"));

            const { modifiedCount } = await this.user //
                .updateOne({ _id: uploader }, { $pull: { books: bookId } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("error.user.failedUpdateUser"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
