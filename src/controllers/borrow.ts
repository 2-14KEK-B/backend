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
        this.router.patch(
            "/borrow/:id([0-9a-fA-F]{24})/verify",
            authenticationMiddleware,
            this.modifyVerificationByBorrowId,
        );
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
            const { from, books } = req.body;
            if (await isIdNotValid(this.user, [from], next)) return;
            if (await isIdNotValid(this.book, books, next)) return;
            const loggedInUserId = req.session["userId"] as string;
            if (loggedInUserId == from) return next(new HttpError("You cannot borrow book from yourself"));

            const alreadyExist = await this.borrow
                .exists({ from: from, to: loggedInUserId, books: { $in: [books] } })
                .exec();
            if (alreadyExist != null) return next(new HttpError("You cannot create new borrow with this book"));

            const newBorrow = await this.borrow //
                .create({
                    to: loggedInUserId,
                    from: from,
                    books: [...books],
                });
            if (!newBorrow) return next(new HttpError("Failed to create borrow"));
            console.log(newBorrow);

            const { modifiedCount } = await this.user //
                .updateMany(
                    {
                        _id: { $in: [from, loggedInUserId] },
                    },
                    { $push: { borrows: { _id: newBorrow._id } } },
                )
                .exec();
            if (!modifiedCount && modifiedCount != 2) return next(new HttpError("Failed to update users"));

            await this.user.createNotification(from, loggedInUserId, newBorrow._id.toString(), "borrow", "create");

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
            const loggedInUserId = req.session["userId"] as string;

            const borrowToModify = await this.borrow
                .findOne({ _id: borrowId, $or: [{ from: loggedInUserId }, { to: loggedInUserId }], verified: false })
                .lean<Borrow>()
                .exec();
            if (borrowToModify == null) return next(new HttpError("You cannot modify this borrow"));

            const modifiedBorrow = await this.borrow
                .findByIdAndUpdate(borrowId, { ...req.body, updatedAt: new Date() }, { new: true })
                .populate({ path: "from to", select: "username fullname email picture" })
                .populate({ path: "books", select: "username fullname email picture" })
                .lean<Borrow>()
                .exec();
            if (!modifiedBorrow) return next(new HttpError("Failed to update borrow"));

            const otherUserId =
                borrowToModify.from.toString() == loggedInUserId
                    ? borrowToModify.to.toString()
                    : borrowToModify.from.toString();

            await this.user.createNotification(otherUserId, loggedInUserId, borrowId, "borrow", "update");

            res.json(modifiedBorrow);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private modifyVerificationByBorrowId = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            const loggedInUserId = req.session["userId"] as string;

            const borrowToModify = await this.borrow
                .findOne({ _id: borrowId, $or: [{ from: loggedInUserId }, { to: loggedInUserId }], verified: false })
                .lean<Borrow>()
                .exec();
            if (borrowToModify == null) return next(new HttpError("You cannot modify this borrow"));

            if (borrowToModify.verified || loggedInUserId != borrowToModify.from.toString())
                return next(new HttpError("You cannot modify the 'verified' field"));

            const { modifiedCount } = await this.borrow
                .updateOne({ _id: borrowId }, { $set: { verified: true } })
                .exec();
            if (!modifiedCount && modifiedCount != 1) return next(new HttpError("Failed to update borrow"));

            await this.user.createNotification(
                borrowToModify.to.toString(),
                loggedInUserId,
                borrowId,
                "borrow",
                "verify",
            );

            res.sendStatus(StatusCode.NoContent);
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

            const { deletedCount } = await this.borrow //
                .deleteOne({ _id: borrowId })
                .exec();
            if (!deletedCount && deletedCount != 1) return next(new HttpError(`Failed to delete borrow`));

            const { modifiedCount } = await this.user
                .updateMany({ _id: { $in: [from, to] } }, { $pull: { borrows: borrowId } })
                .exec();
            if (!modifiedCount && modifiedCount != 2) return next(new HttpError("Failed to update users"));

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

            const { deletedCount } = await this.borrow //
                .deleteOne({ _id: borrowId })
                .exec();
            if (!deletedCount && deletedCount != 1)
                return next(new HttpError(`Failed to delete borrow by id ${borrowId}`));

            const { modifiedCount } = await this.user
                .updateMany({ _id: { $in: [from, to] } }, { $pull: { borrows: borrowId } })
                .exec();
            if (!modifiedCount && modifiedCount != 2) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
