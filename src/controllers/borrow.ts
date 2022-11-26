import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import { CreateBorrowDto, ModifyBorrowDto } from "@validators/borrow";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { Borrow, CreateBorrow, ModifyBorrow } from "@interfaces/borrow";
import type { User } from "@interfaces/user";

export default class BorrowController implements Controller {
    path = "/borrow";
    router = Router();
    private borrow = borrowModel;
    private user = userModel;
    private book = bookModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.all("*", authentication);
        this.router.get(`${this.path}/all`, authorization(["admin"]), this.getAllBorrows);
        this.router.get(`${this.path}/:id`, this.getBorrowById);
        this.router.post(this.path, validation(CreateBorrowDto), this.createBorrow);
        this.router.patch(`${this.path}/:id`, validation(ModifyBorrowDto, true), this.modifyBorrowById);
        this.router.delete(`${this.path}/:id`, authorization(["admin"]), this.deleteBorrowById);
    }

    private getAllBorrows = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const borrows = await this.borrow.find().lean<Borrow[]>().exec();
            res.send(borrows);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getBorrowById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (!(await isIdValid(this.borrow, [borrowId], next))) return;

            const borrow = await this.borrow.findById(borrowId).populate(["books"]).lean<Borrow>().exec();
            if (!borrow) return next(new HttpError(`Failed to get borrow by id ${borrowId}`));

            res.send(borrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private createBorrow = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            const { from_id, books }: CreateBorrow = req.body;
            if (!(await isIdValid(this.user, [from_id], next))) return;
            if (!(await isIdValid(this.book, books, next))) return;

            const newBorrow = await this.borrow.create({ to_id: userId, from_id: from_id, books: [...books] });
            if (!newBorrow) return next(new HttpError("Failed to create borrow"));

            const { acknowledged } = await this.user
                .updateMany({ _id: { $in: [from_id, userId] } }, { $push: { borrows: { _id: newBorrow._id } } })
                .exec();
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.send(newBorrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private modifyBorrowById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            const borrowId = req.params["id"];
            if (!(await isIdValid(this.borrow, [borrowId], next))) return;

            const loggedUser = await this.user.findById(userId).lean<User>().exec();
            const borrowData: ModifyBorrow = { ...req.body };

            if (loggedUser.role != "admin") {
                if (!loggedUser.borrows.some(id => id.valueOf() === borrowId)) {
                    return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
                }
                const borrow = await this.borrow.findById(borrowId).lean<Borrow>().exec();
                if (borrow.from_id.valueOf() !== userId) {
                    if (borrowData.verified !== undefined) {
                        return next(new HttpError("You can not modify this value", StatusCode.Unauthorized));
                    }
                }
            }

            const modifiedBorrow = await this.borrow
                .findByIdAndUpdate(borrowId, { ...borrowData, updated_on: new Date() }, { returnDocument: "after" })
                .lean<Borrow>()
                .exec();
            if (!modifiedBorrow) return next(new HttpError("Failed to update borrow"));

            res.json(modifiedBorrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteBorrowById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (!(await isIdValid(this.borrow, [borrowId], next))) return;

            const { from_id, to_id } = await this.borrow.findById(borrowId).lean<Borrow>().exec();
            if (!from_id || !to_id) return next(new HttpError("Failed to get ids from borrow"));

            const response = await this.borrow.findByIdAndDelete(borrowId);
            if (!response) return next(new HttpError(`Failed to delete borrow by id ${borrowId}`));

            const { acknowledged } = await this.user.updateMany({ _id: { $in: [from_id, to_id] } }, { $pull: { borrows: borrowId } });
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
