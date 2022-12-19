import { Router, Request, Response, NextFunction } from "express";
import UserRatingController from "./userRating";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import isIdNotValid from "@utils/idChecker";
import getPaginated from "@utils/getPaginated";
import ModifyUserDto from "@validators/user";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { ModifyUser, User } from "@interfaces/user";
import type { FilterQuery, SortOrder } from "mongoose";

export default class UserController implements Controller {
    path = "/user";
    router = Router();
    private user = userModel;

    constructor() {
        this.router.use(`${this.path}/rate`, new UserRatingController().router);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/me`, authentication, this.getMyUserInfo);
        this.router.get(this.path, [authentication, authorization(["admin"])], this.getAllUsers);
        this.router
            .route(`${this.path}/:id([0-9a-fA-F]{24})`)
            .get(this.getUserById)
            .patch([authentication, validation(ModifyUserDto, true)], this.modifyUserById)
            .delete(authentication, this.deleteUserById);
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

            const users = await getPaginated(this.user, query, skip, limit, sort, sortBy);

            res.json(users);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getMyUserInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];

            const user = await this.user.getInitialData(userId as string);

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
                .findById(userId, "-email_is_verified -role -messages -rated_books")
                .populate({ path: "books" })
                .populate({
                    path: "borrows",
                    select: "books from_id to_id verified",
                    populate: { path: "books", select: "author available createdAt for_borrow price title picture" },
                })
                .populate({
                    path: "user_ratings",
                    populate: {
                        path: "from_me to_me",
                        select: "from_id to_id createdAt rate comment",
                        populate: { path: "from_id to_id" },
                    },
                })
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
