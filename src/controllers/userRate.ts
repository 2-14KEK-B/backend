import getPaginated from "@utils/getPaginated";
import { Router, Request, Response, NextFunction } from "express";
import validationMiddleware from "@middlewares/validation";
import authenticationMiddleware from "@middlewares/authentication";
import authorizationMiddleware from "@middlewares/authorization";
import userRateModel from "@models/userRate";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import isIdNotValid from "@utils/idChecker";
import { ModifyUserRateDto, CreateUserRateDto } from "@validators/userRate";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { CreateUserRate, ModifyUserRate, UserRate } from "@interfaces/userRate";

export default class UserRateController implements Controller {
    router = Router();
    borrow = borrowModel;
    user = userModel;
    userRate = userRateModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get(`/user/me/rate`, authenticationMiddleware, this.getUserRatesByLoggedInUser);
        this.router.get("/user/rate/:id", authenticationMiddleware, this.getUserRateById);
        this.router
            .route(`/user/:id([0-9a-fA-F]{24})/rate`)
            .all(authenticationMiddleware)
            .get(this.getUserRatesByUserId)
            .post(validationMiddleware(CreateUserRateDto), this.createUserRate);
        this.router
            .route(`/user/:id([0-9a-fA-F]{24})/rate/:rateId([0-9a-fA-F]{24})`)
            .all(authenticationMiddleware)
            .patch(validationMiddleware(ModifyUserRateDto, true), this.modifyUserRateByUserAndRateId)
            .delete(this.deleteUserRateByUserAndRateId);
        this.router.get("/borrow/:id([0-9a-fA-F]{24})/rate", authenticationMiddleware, this.getUserRatesByBorrowId);
        // ADMIN
        this.router.get(
            `/admin/user/rate`,
            [authenticationMiddleware, authorizationMiddleware(["admin"])],
            this.adminGetUserRates,
        );
        this.router
            .route(`/admin/user/rate/:rateId([0-9a-fA-F]{24})`)
            .all([authenticationMiddleware, authorizationMiddleware(["admin"])])
            .patch(this.adminModifyUserRateByRateId)
            .delete(this.adminDeleteUserRateByRateId);
    }

    private getUserRateById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const rateId = req.params["id"];
            if (await isIdNotValid(this.userRate, [rateId], next)) return;
            const userId = req.session["userId"];

            const userRate = await this.userRate
                .findOne({ _id: rateId, $or: [{ from: userId }, { to: userId }] })
                .populate({
                    path: "borrow",
                    populate: [
                        { path: "from to", select: "username fullname email picture" },
                        {
                            path: "books",
                            populate: [
                                { path: "uploader", select: "username fullname email picture" },
                                {
                                    path: "rates",
                                    populate: { path: "from", select: "username fullname email picture" },
                                },
                            ],
                        },
                    ],
                })
                .populate({ path: "from to", select: "username fullname email picture" })
                .lean<UserRate>()
                .exec();
            if (!userRate) return next(new HttpError("failedGetUserRateById"));

            res.json(userRate);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private getUserRatesByLoggedInUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];

            const userRates = await this.userRate
                .find({ $or: [{ from: userId }, { to: userId }] })
                .lean<UserRate[]>()
                .exec();
            if (!userRates) return next(new HttpError("failedGetUserRates"));

            res.json(userRates);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private getUserRatesByUserId = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;

            const userRates = await this.userRate //
                .find({ to: userId })
                .lean<UserRate[]>()
                .exec();
            if (!userRates) return next(new HttpError("failedGetUserRateByUserId"));

            res.json(userRates);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private getUserRatesByBorrowId = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            const userId = req.session["userId"];

            const userRates = await this.userRate //
                .find({ borrow: borrowId, $or: [{ from: userId }, { to: userId }] })
                .lean<UserRate[]>()
                .exec();
            if (!userRates) return next(new HttpError("failedGetUserRateByBorrowId"));

            res.json(userRates);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private modifyUserRateByUserAndRateId = async (
        req: Request<{ id: string; rateId: string }, unknown, ModifyUserRate>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;
            const rateId = req.params["rateId"];
            if (await isIdNotValid(this.userRate, [rateId], next)) return;
            const loggedInUserId = req.session["userId"] as string;

            const rated = await this.userRate.exists({ _id: rateId, from: loggedInUserId, to: userId }).exec();
            if (rated == null) return next(new HttpError("notHaveUserRateById"));

            const rate = await this.userRate //
                .findOneAndUpdate({ _id: rateId, from: loggedInUserId, to: userId }, req.body, { new: true })
                .populate({ path: "from to", select: "username fullname email picture" })
                .lean<UserRate>()
                .exec();
            if (!rate) return next(new HttpError("failedUpdateUserRate"));

            await this.user.createNotification(userId, loggedInUserId, rateId, "user_rate", "update");

            res.json(rate);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private createUserRate = async (
        req: Request<{ id: string }, unknown, CreateUserRate>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;
            const borrowId = req.body["borrow"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            const loggedInUserId = req.session["userId"] as string;

            const verifiedId = await this.borrow //
                .exists({ _id: borrowId, verified: true })
                .exec();
            if (verifiedId == null) return next(new HttpError("cannotIfBorrowNotVerified"));

            const rate = await this.userRate.create({
                ...req.body,
                from: loggedInUserId,
                to: userId,
            });
            if (!rate) return next(new HttpError("failedCreateUserRate"));

            await this.user.createNotification(userId, loggedInUserId, rate._id.toString(), "user_rate", "create");

            const { modifiedCount } = await this.borrow.updateOne(
                { _id: borrowId },
                { $push: { user_rates: rate._id } },
            );
            if (modifiedCount != 1) return next(new HttpError("failedUpdateUserRate"));

            const { nModified } = await this.user.bulkWrite([
                { updateOne: { filter: { _id: loggedInUserId }, update: { $push: { "user_rates.from": rate._id } } } },
                { updateOne: { filter: { _id: userId }, update: { $push: { "user_rates.to": rate._id } } } },
            ]);
            if (nModified != 2) return next(new HttpError("failedGetUserRates"));

            res.json(await rate.populate({ path: "from to", select: "username fullname email picture" }));
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private deleteUserRateByUserAndRateId = async (
        req: Request<{ id: string; rateId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;
            const rateId = req.params["rateId"];
            if (await isIdNotValid(this.userRate, [rateId], next)) return;
            const loggedInUserId = req.session["userId"] as string;

            const rate = await this.userRate //
                .findOneAndDelete({ _id: rateId, from: loggedInUserId, to: userId })
                .lean<UserRate>()
                .exec();
            if (!rate) return next(new HttpError("failedDeleteUserRate"));

            await this.user.createNotification(userId, loggedInUserId, rateId, "user_rate", "delete");

            const { modifiedCount } = await this.borrow
                .updateOne({ _id: rate.borrow }, { $pull: { user_rates: rateId } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("failedUpdateBorrow"));

            const { nModified } = await this.user.bulkWrite([
                { updateOne: { filter: { _id: loggedInUserId }, update: { $pull: { "user_rates.from": rate._id } } } },
                { updateOne: { filter: { _id: userId }, update: { $pull: { "user_rates.to": rate._id } } } },
            ]);

            if (nModified != 2) return next(new HttpError("failedUpdateUsers"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    //ADMIN
    private adminGetUserRates = async (
        req: Request<
            unknown,
            unknown,
            unknown,
            { skip?: string; limit?: string; sort?: "asc" | "desc"; sortBy?: string; keyword?: string }
        >,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, sortBy } = req.query;

            const userRates = await getPaginated(this.userRate, {}, skip, limit, sort, sortBy);

            res.json(userRates);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminModifyUserRateByRateId = async (
        req: Request<{ rateId: string }, unknown, ModifyUserRate>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const rateId = req.params["rateId"];
            if (await isIdNotValid(this.userRate, [rateId], next)) return;

            const rate = await this.userRate //
                .findOneAndUpdate({ _id: rateId }, req.body, { new: true })
                .lean<UserRate>()
                .exec();

            if (!rate) return next(new HttpError("failedUpdateUserRate"));

            res.json(rate);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminDeleteUserRateByRateId = async (
        req: Request<{ rateId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const rateId = req.params["rateId"];
            if (await isIdNotValid(this.userRate, [rateId], next)) return;

            const rate = await this.userRate.findById(rateId).lean<UserRate>().exec();

            const { acknowledged } = await this.userRate //
                .deleteOne({ _id: rateId })
                .exec();
            if (!acknowledged) return next(new HttpError("failedDeleteUserRate"));

            const { modifiedCount } = await this.borrow
                .updateOne({ _id: rate.borrow }, { $pull: { user_rates: rateId } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("failedUpdateBorrow"));

            const { nModified: userUpdateCount } = await this.user.bulkWrite([
                { updateOne: { filter: { _id: rate.from }, update: { $pull: { "user_rates.from": rate._id } } } },
                { updateOne: { filter: { _id: rate.to }, update: { $pull: { "user_rates.to": rate._id } } } },
            ]);

            if (userUpdateCount != 2) return next(new HttpError("failedUpdateUsers"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
