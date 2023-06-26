import { Router, type Request, type Response, type NextFunction } from "express";
import { UserRateController, NotificationController } from "@controllers";
import {
    authenticationMiddleware as authentication,
    authorizationMiddleware as authorization,
    validationMiddleware as validation,
} from "@middlewares";
import { userModel } from "@models";
import { StatusCode, isIdNotValid, getPaginated } from "@utils";
import { ModifyUserDto } from "@validators";
import { HttpError } from "@exceptions";
import type { Controller, ModifyUser, User } from "@interfaces";
import type { FilterQuery, SortOrder } from "mongoose";

export default class UserController implements Controller {
    router = Router();
    private user = userModel;

    constructor() {
        this.router.use("/", new UserRateController().router);
        this.router.use("/", new NotificationController().router);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/user/:id([0-9a-fA-F]{24})", this.getUserById);
        this.router
            .route(`/user/me`)
            .all(authentication)
            .get(this.getLoggedInUser)
            .patch(validation(ModifyUserDto, true), this.modifyLoggedInUser)
            .delete(this.deleteLoggedInUser);
        // ADMIN
        this.router.get("/admin/user", [authentication, authorization(["admin"])], this.adminGetUsers);
        this.router
            .route("/admin/user/:id([0-9a-fA-F]{24})")
            .all([authentication, authorization(["admin"])])
            .patch(validation(ModifyUserDto, true), this.adminModifyUserById)
            .delete(this.adminDeleteUserById);
    }

    //TODO: csak a szükséges adatok küldése
    private getUserById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            const user = await this.user
                .findById(userId, "-email_is_verified -role -messages -rated_books -borrows")
                .populate({ path: "books", match: { available: true }, select: "author title picture category" })
                .populate({
                    path: "user_rates",
                    populate: {
                        path: "to",
                        select: "from createdAt rate comment",
                        populate: { path: "from", select: "username email fullname picture" },
                    },
                })
                .lean<User>()
                .exec();
            if (!user) return next(new HttpError("error.user.failedToGetUserById"));

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    private getLoggedInUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"] as string;

            const user = await this.user.getInitialData(userId);

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private modifyLoggedInUser = async (
        req: Request<unknown, unknown, ModifyUser>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.session["userId"];

            const userData: Partial<User> = { ...req.body, updatedAt: new Date() };

            const user = await this.user //
                .findByIdAndUpdate(userId, userData, { new: true, runValidators: true })
                .lean<User>()
                .exec();
            if (user == null) {
                return next(new HttpError("error.user.failedUpdateYourUser"));
            }

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private deleteLoggedInUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"] as string;

            const { deletedCount } = await this.user //
                .deleteOne({ _id: userId })
                .exec();
            if (deletedCount != 1) {
                return next(new HttpError("error.user.failedDeleteYourUser"));
            }

            req.session.destroy(error => {
                if (error) {
                    return next(error);
                }
                res.clearCookie("session-id");
                res.sendStatus(StatusCode.NoContent);
            });
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    // ADMIN
    private adminGetUsers = async (
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
            /* istanbul ignore next */
            next(error);
        }
    };
    private adminModifyUserById = async (
        req: Request<{ id: string }, unknown, ModifyUser>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            const userData: Partial<User> = { ...req.body, updatedAt: new Date() };

            const user = await this.user //
                .findByIdAndUpdate(userId, userData, { new: true, runValidators: true })
                .lean<User>()
                .exec();
            if (!user) return next(new HttpError("error.user.failedUpdateUser"));

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    private adminDeleteUserById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            const { deletedCount } = await this.user //
                .deleteOne({ _id: userId })
                .exec();
            if (deletedCount != 1) return next(new HttpError("error.user.failedDeleteUser"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
