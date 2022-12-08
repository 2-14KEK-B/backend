import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import { CreateBorrowDto, ModifyBorrowDto } from "@validators/borrow";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { Borrow, CreateBorrow, ModifyBorrow } from "@interfaces/borrow";
import type { FilterQuery, SortOrder, Types } from "mongoose";

export default class BorrowController implements Controller {
    path = "/borrow";
    router = Router();
    private user = userModel;
    private book = bookModel;
    private borrow = borrowModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.all("*", authentication);
        this.router.get(`${this.path}/all`, authorization(["admin"]), this.getAllBorrows);
        this.router //
            .route(this.path)
            .get(this.getBorrows)
            .post(validation(CreateBorrowDto), this.createBorrow);
        this.router
            .route(`${this.path}/:id`)
            .get(this.getBorrowById)
            .patch(validation(ModifyBorrowDto, true), this.modifyBorrowById)
            .delete(authorization(["admin"]), this.deleteBorrowById);
    }

    private getAllBorrows = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const borrows = await this.borrow //
                .find()
                .lean<Borrow[]>()
                .exec();

            res.json(borrows);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getBorrows = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            {
                skip?: string;
                limit?: string;
                sort?: SortOrder;
                sortBy?: string;
                userId?: string;
            }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const loggedInUserId = req.session["userId"];
            const { skip, limit, sort, sortBy, userId } = req.query;

            let query: FilterQuery<Borrow> = { $or: [{ from_id: loggedInUserId }, { to_id: loggedInUserId }] };

            if (userId && userId != loggedInUserId) {
                if (await isIdNotValid(this.user, [userId], next)) {
                    return;
                }
                if (req.session["role"] != "admin") {
                    return next(new HttpError("You cannot get other user's borrows.", StatusCode.Forbidden));
                }
                query = { $or: [{ from_id: userId }, { to_id: userId }] };
            }

            let sorting: { [_ in keyof Partial<Borrow>]: SortOrder } | string = {
                createdAt: sort || "desc",
            };
            if (sort && sortBy) sorting = `${sort == "asc" ? "" : "-"}${sortBy}`;

            const borrows = await this.borrow //
                .find(query)
                .sort(sorting)
                .skip(Number.parseInt(skip as string) || 0)
                .limit(Number.parseInt(limit as string) || 10)
                .lean<Borrow[]>()
                .exec();

            res.json(borrows);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getBorrowById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
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
            next(new HttpError(error.message));
        }
    };

    private createBorrow = async (req: Request<unknown, unknown, CreateBorrow>, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            const { from_id, books } = req.body;
            if (await isIdNotValid(this.user, [from_id], next)) return;
            if (await isIdNotValid(this.book, books, next)) return;

            const newBorrow = await this.borrow //
                .create({
                    to_id: userId,
                    from_id: from_id,
                    books: [...books],
                });
            if (!newBorrow) return next(new HttpError("Failed to create borrow"));

            const { acknowledged } = await this.user //
                .updateMany(
                    {
                        _id: { $in: [from_id, userId] },
                    },
                    { $push: { borrows: { _id: newBorrow._id } } },
                )
                .exec();
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.json(newBorrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private modifyBorrowById = async (
        req: Request<{ id: string }, unknown, ModifyBorrow>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const loggedInUserId = req.session["userId"];
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;

            const { from_id, to_id } = await this.borrow //
                .findById(borrowId, { from_id: 1, to_id: 1 })
                .lean<{ from_id: Types.ObjectId; to_id: Types.ObjectId }>()
                .exec();

            if (req.session["role"] != "admin") {
                if (![from_id.toString(), to_id.toString()].includes(loggedInUserId as string)) {
                    return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
                }
                if (from_id.toString() !== loggedInUserId) {
                    if (req.body.verified !== undefined) {
                        return next(new HttpError("You can not modify this value", StatusCode.Unauthorized));
                    }
                }
            }

            const modifiedBorrow = await this.borrow
                .findByIdAndUpdate(borrowId, { ...req.body, updatedAt: new Date() }, { returnDocument: "after" })
                .lean<Borrow>()
                .exec();
            if (!modifiedBorrow) return next(new HttpError("Failed to update borrow"));

            res.json(modifiedBorrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteBorrowById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;

            const { from_id, to_id } = await this.borrow //
                .findById(borrowId, { from_id: 1, to_id: 1 })
                .lean<{ from_id: Types.ObjectId; to_id: Types.ObjectId }>()
                .exec();
            if (!from_id || !to_id) return next(new HttpError("Failed to get ids from borrow"));

            const { acknowledged: successfullBorrowDelete } = await this.borrow //
                .deleteOne({ _id: borrowId })
                .exec();
            if (!successfullBorrowDelete) return next(new HttpError(`Failed to delete borrow by id ${borrowId}`));

            const { acknowledged: successfullDeleteFromUser } = await this.user
                .updateMany({ _id: { $in: [from_id, to_id] } }, { $pull: { borrows: borrowId } })
                .exec();
            if (!successfullDeleteFromUser) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
