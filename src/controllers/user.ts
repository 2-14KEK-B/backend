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
import type { FilterQuery, SortOrder } from "mongoose";
import UserRatingController from "./userRating";

export default class UserController implements Controller {
    path = "/user";
    router = Router();
    private user = userModel;

    constructor() {
        this.router.use(`${this.path}/rate`, new UserRatingController().router);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.all("*", authentication);
        this.router.get(`${this.path}/me`, this.getMyUserInfo);
        this.router.get(this.path, authorization(["admin"]), this.getAllUsers);
        this.router
            .route(`${this.path}/:id`)
            .get(this.getUserById)
            .patch(validation(ModifyUserDto, true), this.modifyUserById)
            .delete(this.deleteUserById);
    }

    private getAllUsers = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            { skip?: string; limit?: string; sort?: SortOrder; sortBy?: string; keyword?: string }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, sortBy, keyword } = req.query;

            let query: FilterQuery<User> = {};

            if (keyword) {
                const regex = new RegExp(keyword, "i");

                query = {
                    $or: [
                        { email: { $regex: regex } },
                        { fullname: { $regex: regex } },
                        { username: { $regex: regex } },
                    ],
                };
            }

            let sortQuery: { [_ in keyof Partial<User>]: SortOrder } | string = {
                createdAt: sort || "desc",
            };
            if (sort && sortBy) sortQuery = `${sort == "asc" ? "" : "-"}${sortBy}`;

            const users = await this.user //
                .find(query)
                .sort(sortQuery)
                .skip(Number.parseInt(skip as string) || 0)
                .limit(Number.parseInt(limit as string) || 10)
                .lean<User[]>()
                .exec();

            res.json(users);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getMyUserInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];

            const user = await this.user
                .findById(userId, "-password")
                .populate(["books", "borrows", "messages", "user_ratings"])
                .lean<User>()
                .exec();

            res.json(user);
        } catch (error) {
            next(new HttpError(error.message));
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
            next(new HttpError(error.message));
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

            if (req.session["role"] != "admin") {
                if (req.session["userId"] != userId) {
                    return next(new HttpError("You cannot modify other user's data.", StatusCode.Forbidden));
                }
            }

            const userData: Partial<User> = { ...req.body, updatedAt: new Date() };

            const user = await this.user
                .findByIdAndUpdate(userId, userData, { returnDocument: "after", projection: "-password" })
                .lean<User>()
                .exec();
            if (!user) return next(new HttpError("Failed to update user"));

            res.json(user);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteUserById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            if (req.session["role"] != "admin") {
                if (req.session["userId"] != userId) {
                    return next(new HttpError("You can not delete other user"));
                }
            }

            const { acknowledged } = await this.user //
                .deleteOne({ _id: userId })
                .exec();
            if (!acknowledged) return next(new HttpError("Failed to delete user"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
