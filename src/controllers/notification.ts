import { type NextFunction, type Request, type Response, Router } from "express";
import { userModel, borrowModel, userRateModel } from "@models";
import { authenticationMiddleware as authentication } from "@middlewares";
import { isIdNotValid, StatusCode } from "@utils";
import { HttpError } from "@exceptions";
import type { Controller, CreateNotification } from "@interfaces";

export default class NotificationController implements Controller {
    router = Router();
    private user = userModel;
    private borrow = borrowModel;
    private userRate = userRateModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.get("/user/me/notification", authentication, this.getAllNotificationByLoggedInUser);
        this.router.post("/user/:id([0-9a-fA-F]{24})/notification", authentication, this.createNotificationByUserId);
        this.router
            .route("/user/me/notification/:id([0-9a-fA-F]{24})")
            .all(authentication)
            .patch(this.modifySeenByNotificationId)
            .delete(this.deleteNotificationOfLoggedInUserById);
    }

    private getAllNotificationByLoggedInUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const loggedInId = req.session["userId"];

            const user = await this.user
                .findById(loggedInId, { _id: 0, notifications: 1 })
                .populate({ path: "notifications.from", select: "username fullname email picture" })
                .lean<{ notifications: Notification[] }>()
                .exec();
            if (user == null) return;
            const { notifications } = user;

            if (notifications == null) return next(new HttpError("error.notification.failedGetNotifications"));

            res.json(notifications);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
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
            next(error);
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
            if (isExists == null) return next(new HttpError("error.notification.failedGetNotificationById"));

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
                        runValidators: true,
                    },
                )
                .exec();
            if (modifiedCount != 1) return next(new HttpError("error.notification.failedUpdateNotificationSeen"));

            res.sendStatus(StatusCode.OK);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
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

            const isExists = await this.user //
                .exists({ _id: loggedInId, "notifications._id": notificationId })
                .exec();
            if (isExists == null) return next(new HttpError("error.notification.failedGetNotificationById"));

            const { modifiedCount } = await this.user
                .updateOne({ _id: loggedInId }, { $pull: { notifications: { _id: notificationId } } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("error.notification.failedDeleteNotificationById"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
