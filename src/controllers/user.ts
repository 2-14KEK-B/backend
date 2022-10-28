import { Router, Request, Response, NextFunction } from "express";
import authMiddleware from "@middlewares/auth";
import validationMiddleware from "@middlewares/validation";
import userModel from "@models/user";
import ModifyUserDto from "@validators/user";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import UserNotFoundException from "@exceptions/UserNotFound";
import HttpError from "@exceptions/Http";
import Controller from "@interfaces/controller";
import { ModifyUser } from "@interfaces/user";

export default class UserController implements Controller {
    path = "/users";
    router = Router();
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, authMiddleware, this.getAllUsers);
        this.router.get(`${this.path}/:id`, authMiddleware, this.getUserById);
        this.router.patch(`${this.path}/:id`, [authMiddleware, validationMiddleware(ModifyUserDto, true)], this.modifyUserById);
        this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteUserById);
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
            if (!(await isIdValid(this.user, [userId], next))) return;

            const user = await this.user.findById(userId);
            if (!user) return next(new UserNotFoundException(userId));

            res.send(user);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private modifyUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.id;
            if (!(await isIdValid(this.user, [userId], next))) return;

            const userData: ModifyUser = req.body;
            const user = await this.user.findByIdAndUpdate(userId, userData, { returnDocument: "after" });
            if (!user) return next(new HttpError("Failed to update user"));

            res.send(user);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.id;
            if (!(await isIdValid(this.user, [userId], next))) return;

            const successResponse = await this.user.findByIdAndDelete(userId);
            if (!successResponse) return next(new UserNotFoundException(userId));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
