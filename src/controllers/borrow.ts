import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import { CreateBorrowDto, ModifyBorrowDto } from "@validators/borrow";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import Controller from "@interfaces/controller";
import { CreateBorrow, ModifyBorrow } from "@interfaces/borrow";

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

    private getAllBorrows = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrows = await this.borrow.find().populate(["books"]);
            res.send(borrows);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getBorrowById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrowId: string = req.params.id;
            if (!(await isIdValid(this.borrow, [borrowId], next))) return;

            const borrow = await this.borrow.findById(borrowId).populate(["books", "from_id", "to_id"]);
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
            if (!(await isIdValid(this.user, [from_id], next)) || !(await isIdValid(this.book, books, next))) return;

            const now = new Date();
            const newBorrow = await this.borrow.create({ time: now, to_id: userId, from_id: from_id, books: [...books] });
            if (!newBorrow) return next(new HttpError("Failed to create borrow"));

            const { acknowledged } = await this.user.updateMany({ _id: { $in: [from_id, userId] } }, { $push: { borrows: { _id: newBorrow._id } } });
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.send(newBorrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private modifyBorrowById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrowId: string = req.params.id;
            if (!(await isIdValid(this.borrow, [borrowId], next))) return;

            const borrowData: ModifyBorrow = req.body;
            const borrow = this.borrow.findByIdAndUpdate(borrowId, borrowData, { returnDocument: "after" });
            if (!borrow) return next(new HttpError("Failed to update borrow"));

            res.send(borrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteBorrowById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrowId: string = req.params.id;
            if (!(await isIdValid(this.borrow, [borrowId], next))) return;

            const { from_id, to_id } = await this.borrow.findById(borrowId);
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
