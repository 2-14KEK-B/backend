import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import authMiddleware from "@middlewares/auth";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import IdNotValidException from "@exceptions/IdNotValid";
import Controller from "@interfaces/controller";

export default class BorrowController implements Controller {
    path = "/borrows";
    router = Router();
    private borrow = borrowModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.getAllBorrows);
        this.router.get(`${this.path}/:id`, this.getBorrowById);
        this.router.post(this.path, authMiddleware, this.createBorrow);
        this.router.delete(`${this.path}/:id`, this.deleteBorrowById);
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
            if (!Types.ObjectId.isValid(borrowId)) return next(new IdNotValidException(borrowId));

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
            if (!Types.ObjectId.isValid(userId)) return next(new IdNotValidException(userId));

            const borrowData: { from_id: string; books: string[] } = req.body;
            if (!Types.ObjectId.isValid(borrowData.from_id)) return next(new IdNotValidException(borrowData.from_id));

            const now = new Date();
            const newBorrow = await this.borrow.create({ time: now, to_id: userId, from_id: borrowData.from_id, books: [...borrowData.books] });
            if (!newBorrow) return next(new HttpError("Failed to create borrow"));

            const { acknowledged } = await this.user.updateMany(
                { _id: { $in: [borrowData.from_id, userId] } },
                { $push: { borrows: { _id: newBorrow._id } } },
            );
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.send(newBorrow);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteBorrowById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrowId: string = req.params.id;
            if (!Types.ObjectId.isValid(borrowId)) return next(new IdNotValidException(borrowId));

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
