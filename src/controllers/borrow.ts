import { Router, Request, Response, NextFunction } from "express";
import authenticationMiddleware from "@middlewares/authentication";
import authorizationMiddleware from "@middlewares/authorization";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import getPaginated from "@utils/getPaginated";
import { CreateBorrowDto, ModifyBorrowDto } from "@validators/borrow";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { Borrow, CreateBorrow, ModifyBorrow } from "@interfaces/borrow";
import type { Types } from "mongoose";

export default class BorrowController implements Controller {
    router = Router();
    private user = userModel;
    private book = bookModel;
    private borrow = borrowModel;

    constructor() {
        this.initializeRoutes();
    }

    /**
     * Routok:
     *  - usernek
     *      GET
     *      - /user/me/borrow
     *      - /borrow/:id
     *      POST
     *      - /borrow
     *      PATCH
     *      - /borrow/:id
     *      DELETE
     *      - /borrow/:id
     *  - adminnak
     *      GET
     *      - /admin/borrow
     *      - /admin/borrow/:id
     *      PATCH
     *      - /admin/borrow/:id
     *      DELETE
     *      - /admin/borrow/:id
     */

    private initializeRoutes() {
        this.router.get("/user/me/borrow", authenticationMiddleware, this.getLoggedInUserBorrows);
        this.router.post("/borrow", [authenticationMiddleware, validation(CreateBorrowDto)], this.createBorrow);
        this.router
            .route(`/borrow/:id([0-9a-fA-F]{24})`)
            .all(authenticationMiddleware)
            .get(this.getBorrowById)
            .patch(validation(ModifyBorrowDto, true), this.modifyBorrowById)
            .delete(this.deleteBorrowById);
        // ADMIN
        this.router.get(
            `/admin/borrow`,
            [authenticationMiddleware, authorizationMiddleware(["admin"])],
            this.adminGetBorrows,
        );
        this.router
            .route("/admin/borrow/:id([0-9a-fA-F]{24})")
            .all([authenticationMiddleware, authorizationMiddleware(["admin"])])
            .get(this.adminGetBorrowById)
            .patch(this.adminModifyBorrowById)
            .delete(this.adminDeleteBorrowById);
    }

    private getLoggedInUserBorrows = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const loggedInUserId = req.session["userId"];

            const borrow = await this.borrow //
                .findOne({ $or: [{ from: loggedInUserId }, { to: loggedInUserId }] })
                .populate("books from to")
                .populate({
                    path: "from to",
                    select: "username fullname email picture",
                })
                .populate({
                    path: "user_rates",
                    populate: {
                        path: "from to",
                        select: "comment rate createdAt",
                    },
                })
                .lean<Borrow>()
                .exec();
            if (!borrow) return next(new HttpError(`Failed to get borrows`));

            res.json(borrow);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private getBorrowById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            const loggedInUserId = req.session["userId"];

            const borrow = await this.borrow //
                .findOne({ _id: borrowId, $or: [{ from: loggedInUserId }, { to: loggedInUserId }] })
                .populate("books")
                .lean<Borrow>()
                .exec();
            if (!borrow) return next(new HttpError(`Failed to get borrow`));

            res.json(borrow);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private createBorrow = async (req: Request<unknown, unknown, CreateBorrow>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            const { from, books } = req.body;
            if (await isIdNotValid(this.user, [from], next)) return;
            if (await isIdNotValid(this.book, books, next)) return;

            const alreadyExist = await this.borrow.exists({ from: from, to: userId, books: { $in: [books] } }).exec();
            if (alreadyExist != null) return next(new HttpError("You cannot create new borrow with this book"));

            const newBorrow = await this.borrow //
                .create({
                    to: userId,
                    from: from,
                    books: [...books],
                });
            if (!newBorrow) return next(new HttpError("Failed to create borrow"));

            const { acknowledged } = await this.user //
                .updateMany(
                    {
                        _id: { $in: [from, userId] },
                    },
                    { $push: { borrows: { _id: newBorrow._id } } },
                )
                .exec();
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.json(
                await newBorrow.populate([
                    { path: "from to", select: "username fullname email picture" },
                    { path: "books", select: "author title picture" },
                    { path: "user_rates", populate: { path: "from to", select: "username fullname email picture" } },
                ]),
            );
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private modifyBorrowById = async (
        req: Request<{ id: string }, unknown, ModifyBorrow>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            const loggedInUserId = req.session["userId"];

            const borrowToModify = await this.borrow
                .findOne({ _id: borrowId, $or: [{ from: loggedInUserId }, { to: loggedInUserId }] })
                .lean<Borrow>()
                .exec();
            if (borrowToModify == null) return next(new HttpError("You cannot modify this borrow"));

            if (req.body.verified && loggedInUserId != borrowToModify.from.toString())
                return next(new HttpError("You cannot modify the 'verified' field"));

            const modifiedBorrow = await this.borrow
                .findByIdAndUpdate(borrowId, { ...req.body, updatedAt: new Date() }, { new: true })
                .populate({ path: "from to", select: "username fullname email picture" })
                .populate({ path: "books", select: "username fullname email picture" })
                .lean<Borrow>()
                .exec();
            if (!modifiedBorrow) return next(new HttpError("Failed to update borrow"));

            res.json(modifiedBorrow);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private deleteBorrowById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            const loggedInUserId = req.session["userId"];

            const borrowToDelete = await this.borrow //
                .findOne({ _id: borrowId, $or: [{ from: loggedInUserId }, { to: loggedInUserId }] })
                .lean<Borrow>()
                .exec();
            if (borrowToDelete == null) return next(new HttpError("You cannot delete this borrow"));

            const { from, to } = borrowToDelete;

            const { acknowledged: successfullBorrowDelete } = await this.borrow //
                .deleteOne({ _id: borrowId })
                .exec();
            if (!successfullBorrowDelete) return next(new HttpError(`Failed to delete borrow`));

            const { acknowledged: successfullDeleteFromUser } = await this.user
                .updateMany({ _id: { $in: [from, to] } }, { $pull: { borrows: borrowId } })
                .exec();
            if (!successfullDeleteFromUser) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    // ADMIN
    private adminGetBorrows = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            { skip?: string; limit?: string; sort?: "asc" | "desc"; sortBy?: string; keyword?: string }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, sortBy } = req.query;

            const borrows = await getPaginated(this.borrow, {}, skip, limit, sort, sortBy);

            res.json(borrows);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminGetBorrowById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;

            const borrow = await this.borrow //
                .findById(borrowId)
                .populate("books")
                .lean<Borrow>()
                .exec();
            if (!borrow) return next(new HttpError(`Failed to get borrow by id ${borrowId}`));

            res.json(borrow);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminModifyBorrowById = async (
        req: Request<{ id: string }, unknown, ModifyBorrow>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;

            const modifiedBorrow = await this.borrow
                .findByIdAndUpdate(borrowId, { ...req.body, updatedAt: new Date() }, { new: true })
                .lean<Borrow>()
                .exec();
            if (!modifiedBorrow) return next(new HttpError("Failed to update borrow"));

            res.json(modifiedBorrow);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminDeleteBorrowById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;

            const { from, to } = await this.borrow //
                .findById(borrowId, { from: 1, to: 1 })
                .lean<{ from: Types.ObjectId; to: Types.ObjectId }>()
                .exec();
            if (!from || !to) return next(new HttpError("Failed to get ids from borrow"));

            const { acknowledged: successfullBorrowDelete } = await this.borrow //
                .deleteOne({ _id: borrowId })
                .exec();
            if (!successfullBorrowDelete) return next(new HttpError(`Failed to delete borrow by id ${borrowId}`));

            const { acknowledged: successfullDeleteFromUser } = await this.user
                .updateMany({ _id: { $in: [from, to] } }, { $pull: { borrows: borrowId } })
                .exec();
            if (!successfullDeleteFromUser) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
