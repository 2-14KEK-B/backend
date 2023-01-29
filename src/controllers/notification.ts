import { NextFunction, Request, Response, Router } from "express";
import userModel from "@models/user";
import authenticationMiddleware from "@middlewares/authentication";
import borrowModel from "@models/borrow";
import userRateModel from "@models/userRate";
import isIdNotValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { CreateNotification } from "@interfaces/notification";

export default class NotificationController implements Controller {
    router = Router();
    private user = userModel;
    private borrow = borrowModel;
    private userRate = userRateModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get("/user/me/notification", authenticationMiddleware, this.getAllNotificationByLoggedInUser);
        this.router.post(
            "/user/:id([0-9a-fA-F]{24})/notification",
            authenticationMiddleware,
            this.createNotificationByUserId,
        );
        this.router
            .route("/user/me/notification/:id([0-9a-fA-F]{24})")
            .all(authenticationMiddleware)
            .patch(this.modifySeenByNotificationId)
            .delete(this.deleteNotificationOfLoggedInUserById);
    }

    private getAllNotificationByLoggedInUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const loggedInId = req.session["userId"];

            const { notifications } = await this.user
                .findById(loggedInId, { _id: 0, notifications: 1 })
                .populate({ path: "notifications.from", select: "username fullname email picture" })
                .lean<{ notifications: Notification[] }>()
                .exec();
            if (notifications == null) return next(new HttpError("failedGetNotifications"));

            res.json(notifications);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private createNotificationByUserId = async (
        req: Request<{ id: string }, unknown, CreateNotification>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return next();
            const loggedInId = req.session["userId"] as string;
            const { doc_id, doc_type, not_type } = req.body;

            if (doc_type == "borrow") {
                if (await isIdNotValid(this.borrow, [doc_id], next)) return next();
            } else if (doc_type == "user_rate") {
                if (await isIdNotValid(this.userRate, [doc_id], next)) return next();
            }

            const { modifiedCount } = await this.user //
                .createNotification(userId, loggedInId, doc_id, doc_type, not_type);
            if (modifiedCount != 1) return next(new HttpError("failedCreateNotification"));

            res.sendStatus(StatusCode.OK);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private modifySeenByNotificationId = async (
        req: Request<{ id: string }, unknown, CreateNotification>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const loggedInId = req.session["userId"];
            const notificationId = req.params["id"];

            const isExists = this.user //
                .exists({ _id: loggedInId, notifications: { _id: notificationId } })
                .exec();
            if (isExists == null) return next(new HttpError("failedGetNotificationById"));

            const { modifiedCount } = await this.user
                .updateOne(
                    { _id: loggedInId },
                    {
                        $set: {
                            "notifications.$[elem].seen": true,
                        },
                    },
                    {
                        arrayFilters: [
                            {
                                "elem._id": notificationId,
                                "elem.seen": false,
                            },
                        ],
                    },
                )
                .exec();
            if (modifiedCount != 1) return next(new HttpError("failedUpdateNotificationSeen"));

            res.sendStatus(StatusCode.OK);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private deleteNotificationOfLoggedInUserById = async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const loggedInId = req.session["userId"];
            const notificationId = req.params["id"];

            const isExists = this.user //
                .exists({ _id: loggedInId, notifications: { _id: notificationId } })
                .exec();
            if (isExists == null) return next(new HttpError("failedGetNotificationById"));

            const { modifiedCount } = await this.user
                .updateOne({ _id: loggedInId }, { $pull: { notifications: { _id: notificationId } } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("failedDeleteNotificationById"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
