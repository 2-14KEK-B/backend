import { Router, Request, Response, NextFunction } from "express";
import UserRateController from "./userRate";
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
        this.router.use("/", new UserRateController().router);
        this.initializeRoutes();
    }

    /**
     * Kell
     *  - mindenkinek
     *      GET
     *      - /user/:id
     *  - usernek
     *      PATCH
     *      - /user/me
     *      DELETE
     *      - /user/me
     *  - adminnak
     *      GET
     *      - /user
     *      PATCH
     *      - /user/:id
     *      DELETE
     *      - /user/:id
     */

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

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private getLoggedInUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"] as string;

            const user = await this.user.getInitialData(userId);

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private modifyLoggedInUser = async (
        req: Request<unknown, unknown, ModifyUser>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.session["userId"];

            const user = await this.user //
                .findByIdAndUpdate(userId, { ...req.body, createdAt: new Date() }, { new: true })
                .lean<User>()
                .exec();
            if (user == null) {
                return next(new HttpError("Failed to modify your profile"));
            }

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private deleteLoggedInUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"] as string;

            const { acknowledged } = await this.user //
                .deleteOne({ _id: userId })
                .exec();
            if (!acknowledged) {
                return next(new HttpError("Failed to delete your own profile"));
            }

            req.session.destroy(error => {
                if (error) {
                    return next(new HttpError(error));
                }
                res.clearCookie("session-id");
                res.sendStatus(StatusCode.NoContent);
            });
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
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
            next(new HttpError(error.message));
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
                .findByIdAndUpdate(userId, userData, { new: true })
                .lean<User>()
                .exec();
            if (!user) return next(new HttpError("Failed to update user"));

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminDeleteUserById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            const { acknowledged } = await this.user //
                .deleteOne({ _id: userId })
                .exec();
            if (!acknowledged) return next(new HttpError("Failed to delete user"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
