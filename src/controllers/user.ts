import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import validationMiddleware from "@middlewares/validation";
import userModel from "@models/user";
import UserDto from "@validators/user";
import StatusCode from "@utils/statusCodes";
import UserNotFoundException from "@exceptions/UserNotFound";
import IdNotValidException from "@exceptions/IdNotValid";
import HttpError from "@exceptions/Http";
import Controller from "@interfaces/controller";
import User from "@interfaces/user";

export default class UserController implements Controller {
    path = "/users";
    router = Router();
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.getAllUsers);
        this.router.get(`${this.path}/:id`, this.getUserById);
        this.router.patch(`${this.path}/:id`, [validationMiddleware(UserDto, true)], this.modifyUserById);
        this.router.delete(`${this.path}/:id`, this.deleteUserById);
    }

    private getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await this.user.find().populate(["borrows", "books"]);
            res.send(users);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.id;
            if (!Types.ObjectId.isValid(userId)) return next(new IdNotValidException(userId));

            const user = await this.user.findById(userId);
            if (!user) return next(new UserNotFoundException(userId));

            res.send(user);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private modifyUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (!Types.ObjectId.isValid(id)) return next(new IdNotValidException(id));

            const userData: User = req.body;
            const user = await this.user.findByIdAndUpdate(id, userData, { new: true });
            if (!user) return next(new UserNotFoundException(id));

            res.send(user);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (!Types.ObjectId.isValid(id)) return next(new IdNotValidException(id));

            const successResponse = await this.user.findByIdAndDelete(id);
            if (!successResponse) return next(new UserNotFoundException(id));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
