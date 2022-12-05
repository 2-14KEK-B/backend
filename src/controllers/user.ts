import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import userModel from "@models/user";
import ModifyUserDto from "@validators/user";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { ModifyUser, User } from "@interfaces/user";

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
        this.router
            .route(`${this.path}/:id`)
            .get(this.getUserById)
            .patch(validation(ModifyUserDto, true), this.modifyUserById)
            .delete(authorization(["admin"]), this.deleteUserById);
    }

    private getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await this.user //
                .find()
                .lean<User[]>()
                .exec();

            res.json(users);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getMyUserInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.userId;

            const user = await this.user
                .findById(userId, "-password")
                .populate(["books", "borrows", "messages", "user_ratings"])
                .lean<User>()
                .exec();

            res.json(user);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            const user = await this.user
                .findById(userId, "-password -email_is_verified -role -messages")
                .populate("user_ratings")
                .lean<User>()
                .exec();

            res.json(user);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private modifyUserById = async (
        req: Request<{ id: string }, unknown, ModifyUser>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;
            const loggedUser = await this.user //
                .findById(req.session.userId)
                .lean<User>()
                .exec();

            if (loggedUser.role != "admin") {
                if (userId != loggedUser._id) {
                    return next(new HttpError("You cannot modify other user's data.", StatusCode.Forbidden));
                }
            }

            const userData = { ...req.body, updated_on: new Date() };
            const user = await this.user
                .findByIdAndUpdate(userId, userData, { returnDocument: "after" })
                .lean<User>()
                .exec();
            if (!user) return next(new HttpError("Failed to update user"));

            res.json(user);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private deleteUserById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            const userRes = await this.user //
                .findByIdAndDelete(userId)
                .lean<User>()
                .exec();
            if (!userRes) return next(new HttpError("Failed to delete user"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
