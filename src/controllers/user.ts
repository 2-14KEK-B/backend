import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import userModel from "@models/user";
import ModifyUserDto from "@validators/user";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import UserNotFoundException from "@exceptions/UserNotFound";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { ModifyUser } from "@interfaces/user";

export default class UserController implements Controller {
    path = "/user";
    router = Router();
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.all("*", authentication);
        this.router.get(`${this.path}/me`, this.getMyUserInfo);
        this.router.get(`${this.path}/all`, authorization(["admin"]), this.getAllUsers);
        this.router.get(`${this.path}/:id`, this.getUserById);
        this.router.patch(`${this.path}/:id`, validation(ModifyUserDto, true), this.modifyUserById);
        this.router.delete(`${this.path}/:id`, authorization(["admin"]), this.deleteUserById);
    }

    private getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await this.user.find().lean();
            res.json(users);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getMyUserInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;
            if (!(await isIdValid(this.user, [userId], next))) return;

            const user = await this.user.findById(userId, "-password").populate(["books", "borrows", "messages", "user_ratings"]).lean();
            if (!user) return next(new UserNotFoundException(userId));

            res.json(user);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (!(await isIdValid(this.user, [userId], next))) return;

            const user = await this.user.findById(userId, "-password -email_is_verified -role -messages").populate("user_ratings").lean();
            if (!user) return next(new UserNotFoundException(userId));

            res.json(user);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private modifyUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (!(await isIdValid(this.user, [userId], next))) return;

            if (req.user.role != "admin") {
                if (userId != req.user._id) {
                    return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
                }
            }

            const userData: ModifyUser = { ...req.body, updated_on: new Date() };
            const user = await this.user.findByIdAndUpdate(userId, userData, { returnDocument: "after" });
            if (!user) return next(new HttpError("Failed to update user"));

            res.json(user);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (!(await isIdValid(this.user, [userId], next))) return;

            const successResponse = await this.user.findByIdAndDelete(userId);
            if (!successResponse) return next(new UserNotFoundException(userId));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
