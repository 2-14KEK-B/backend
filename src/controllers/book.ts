import { Router, Request, Response, NextFunction } from "express";
import BookRateController from "./bookRate";
import authorizationMiddleware from "@middlewares/authorization";
import authenticationMiddleware from "@middlewares/authentication";
import validationMiddleware from "@middlewares/validation";
import bookModel from "@models/book";
import userModel from "@models/user";
import { CreateBookDto, ModifyBookDto } from "@validators/book";
import getPaginated from "@utils/getPaginated";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type { FilterQuery, Types, SortOrder } from "mongoose";
import type Controller from "@interfaces/controller";
import type { Book, CreateBook, ModifyBook } from "@interfaces/book";

export default class BookController implements Controller {
    router = Router();
    private book = bookModel;
    private user = userModel;

    constructor() {
        this.router.use("/", new BookRateController().router);
        this.initializeRoutes();
    }

    /**
     * Routok:
     *  - mindenkinek:
     *      GET
     *      - /book/borrow?
     *      - /book/lend?
     *      - /book/:id
     *  - usernek:
     *      GET
     *      - /user/me/book?
     *      POST
     *      - /book
     *      PATCH
     *      - /book/:id
     *      DELETE
     *      - /book/:id
     *  - adminnak
     *      GET
     *      - /admin/book?
     *      PATCH
     *      - /admin/book/:id
     *      DELETE
     *      - /admin/book/:id
     */
    private initializeRoutes() {
        this.router.get(`/book/borrow`, this.getBooksForBorrow);
        this.router.get(`/book/lend`, this.getBooksForLend);
        this.router.get(`/user/me/book`, authenticationMiddleware, this.getLoggedInUserBooks);
        this.router.post("/book", [authenticationMiddleware, validationMiddleware(CreateBookDto)], this.createBook);
        this.router
            .route(`/book/:id([0-9a-fA-F]{24})`)
            .get(this.getBookById)
            .patch([authenticationMiddleware, validationMiddleware(ModifyBookDto, true)], this.modifyBookById)
            .delete(authenticationMiddleware, this.deleteBookById);
        // ADMIN
        this.router.get(
            "/admin/book",
            [authenticationMiddleware, authorizationMiddleware(["admin"])],
            this.adminGetBooks,
        );
        this.router
            .route("/admin/book/:id([0-9a-fA-F]{24})")
            .all([authenticationMiddleware, authorizationMiddleware(["admin"])])
            .patch(this.adminModifyBookById)
            .delete(this.adminDeleteBookById);
    }

    private getBooksForBorrow = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            { skip: string; limit: string; sort: "asc" | "desc"; keyword?: string }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, keyword } = req.query;

            const query: FilterQuery<Book> = { $and: [{ available: true }, { for_borrow: true }] };
            if (keyword) {
                const regex = new RegExp(keyword, "i");

                query.$and?.push({
                    $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }],
                });
            }

            const books = await getPaginated(this.book, query, skip, limit, sort);
            if (!books) return next(new HttpError(`Failed to get books`));

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private getBooksForLend = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            { skip: string; limit: string; sort: "asc" | "desc"; keyword?: string }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, keyword } = req.query;

            const query: FilterQuery<Book> = { $and: [{ available: true }, { for_borrow: false }] };
            if (keyword) {
                const regex = new RegExp(keyword, "i");

                query.$and?.push({
                    $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }],
                });
            }

            const books = await getPaginated(this.book, query, skip, limit, sort);
            if (!books) return next(new HttpError(`Failed to get books`));

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
            if (!book) return next(new HttpError(`Failed to get book by id`));

            res.json(book);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private getLoggedInUserBooks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];

            const books = await this.book //
                .find({ uploader: userId })
                .lean<Book[]>()
                .exec();
            if (!books) return next(new HttpError(`Failed to get user books`));

            res.json(books);
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
                .findOneAndUpdate({ _id: bookId, uploader: userId }, { ...req.body, updated_on: now }, { new: true })
                .lean<Book>()
                .exec();
            if (!modifiedBook) return next(new HttpError("Failed to update book"));

            res.json(modifiedBook);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private deleteBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;
            const loggedInUserId = req.session["userId"];

            const { acknowledged: successfullDeleteBook } = await this.book
                .deleteOne({ _id: bookId, uploader: loggedInUserId })
                .exec();
            if (!successfullDeleteBook) return next(new HttpError(`Failed to delete book`));

            const { acknowledged: successfullDeleteBookFromUser } = await this.user //
                .updateOne({ _id: loggedInUserId }, { $pull: { books: bookId } })
                .exec();
            if (!successfullDeleteBookFromUser) return next(new HttpError(`Failed to update user`));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
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
                    $or: [{ author: { $regex: regex } }, { title: { $regex: regex } }],
                };
            }

            const books = await getPaginated(this.book, query, skip, limit, sort, sortBy);

            res.json(books);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
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
            const newBook = await this.book //
                .findByIdAndUpdate(bookId, { ...req.body, updatedAt: now }, { new: true })
                .lean<Book>()
                .exec();
            if (!newBook) return next(new HttpError("Failed to update book"));

            res.json(newBook);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminDeleteBookById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const bookId = req.params["id"];
            if (await isIdNotValid(this.book, [bookId], next)) return;

            const { uploader } = await this.book //
                .findById(bookId)
                .lean<{ uploader: Types.ObjectId }>()
                .exec();

            const { acknowledged: successfullDeleteBook } = await this.book //
                .deleteOne({ _id: bookId })
                .exec();
            if (!successfullDeleteBook) return next(new HttpError(`Failed to delete book`));

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
