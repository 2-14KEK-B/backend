import getPaginated from "@utils/getPaginated";
import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import messageModel from "@models/message";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import isIdNotValid from "@utils/idChecker";
import CreateMessageDto from "@validators/message";
import HttpError from "@exceptions/Http";
import { Types } from "mongoose";
import type { CreateMessageContent, Message, MessageContent } from "@interfaces/message";
import type Controller from "@interfaces/controller";

export default class MessageController implements Controller {
    router = Router();
    private message = messageModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`/user/me/message`, authentication, this.getLoggedInUserMessages);
        this.router
            .route("/user/:id([0-9a-fA-F]{24})/message")
            .all(authentication)
            .get(authentication, this.getMessageContentsByUserId)
            .post(validation(CreateMessageDto), this.createMessage);
        this.router.patch("/message/:id([0-9a-fA-F]{24})/seen", authentication, this.updateSeenById);
        // ADMIN
        this.router.get(`/admin/message`, [authentication, authorization(["admin"])], this.adminGetMessages);
        this.router
            .route("/admin/message/:id([0-9a-fA-F]{24})")
            .all([authentication, authorization(["admin"])])
            .delete(this.adminDeleteMessageById);
        this.router.delete(
            "/admin/message/:id([0-9a-fA-F]{24})/content/:contentId([0-9a-fA-F]{24})",
            [authentication, authorization(["admin"])],
            this.adminDeleteMessageContentByMessageAndContentId,
        );
    }

    private getLoggedInUserMessages = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const loggedInUserId = req.session["userId"];

            const { messages } = await this.user
                .findById(loggedInUserId, { messages: 1 })
                .populate({
                    path: "messages",
                    options: {
                        projection: {
                            createdAt: 1,
                            updatedAt: 1,
                            message_contents: { $slice: -25 },
                            totalCount: { $size: "$message_contents" },
                        },
                    },
                    populate: {
                        path: "users",
                        select: "fullname username email picture",
                    },
                })
                .lean<{ messages: Message[] }>()
                .exec();
            if (!messages) return next(new HttpError("failedGetMessages"));

            res.json(messages);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private getMessageContentsByUserId = async (
        req: Request<{ id: string }, unknown, unknown, { skip?: string; limit?: string; sort?: "asc" | "desc" }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.params["id"];
            if (await isIdNotValid(this.user, [userId], next)) return;
            const loggedInUserId = req.session["userId"];

            const { skip, limit, sort } = req.query;

            const skipAsNum = Number.parseInt(skip as string),
                limitAsNum = Number.parseInt(limit as string),
                sortAsNum = sort == "asc" ? 1 : -1;

            const messages = await this.message
                .aggregate<{ docs: MessageContent[]; count: number }>([
                    {
                        $match: {
                            users: { $all: [new Types.ObjectId(userId), new Types.ObjectId(loggedInUserId)] },
                        },
                    },
                    {
                        $unwind: "$message_contents",
                    },
                    {
                        $sort: {
                            "message_contents.createdAt": sortAsNum,
                        },
                    },
                    {
                        $group: {
                            _id: "$_id",
                            docs: {
                                $push: "$message_contents",
                            },
                        },
                    },
                    {
                        $project: {
                            message_contents: {
                                $reverseArray: {
                                    $slice: [
                                        "$docs",
                                        isNaN(skipAsNum) ? 25 : skipAsNum,
                                        isNaN(limitAsNum) ? 25 : limitAsNum,
                                    ],
                                },
                            },
                            totalCount: {
                                $size: "$docs",
                            },
                        },
                    },
                ])
                .exec();

            if (messages) {
                res.json(messages[0]);
            } else {
                return next(new HttpError("failedGetMessagesByUserId"));
            }
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private createMessage = async (
        req: Request<{ id: string }, unknown, { content: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const from = req.session["userId"];
            const to = req.params["id"];
            if (await isIdNotValid(this.user, [to], next)) return;

            const newMessageContent: CreateMessageContent = {
                sender_id: new Types.ObjectId(from),
                content: req.body.content,
            };
            const isExists = await this.message //
                .exists({ users: { $all: [from, to] } })
                .exec();

            if (isExists != null) {
                const { modifiedCount } = await this.message
                    .updateOne(
                        { users: { $all: [from, to] } },
                        { $push: { message_contents: { ...newMessageContent } } },
                    )
                    .exec();
                if (modifiedCount != 1) return next(new HttpError("failedCreateMessage"));
                res.json({ message: { ...newMessageContent, createdAt: new Date() }, isNew: false });
            } else {
                const messages = await this.message.create({
                    users: [new Types.ObjectId(from), new Types.ObjectId(to)],
                    message_contents: [newMessageContent],
                });

                if (!messages) return next(new HttpError("failedCreateMessage"));

                const { modifiedCount } = await this.user
                    .updateMany({ _id: { $in: [from, to] } }, { $push: { messages: { _id: messages._id } } })
                    .exec();
                if (modifiedCount != 2) return next(new HttpError("failedUpdateUsers"));

                return res.json({
                    message: {
                        ...(
                            await messages.populate({ path: "users", select: "username fullname email picture" })
                        ).toJSON(),
                        totalCount: 1,
                    },
                    isNew: true,
                });
            }
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    private updateSeenById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const messageId = req.params["id"];
            if (await isIdNotValid(this.message, [messageId], next)) return;
            const loggedInUserId = req.session["userId"];

            const { modifiedCount } = await this.message.updateOne(
                { _id: messageId, users: loggedInUserId },
                {
                    $set: {
                        "message_contents.$[elem].seen": true,
                    },
                },
                {
                    arrayFilters: [
                        {
                            "elem.sender_id": { $ne: new Types.ObjectId(loggedInUserId) },
                            "elem.seen": false,
                        },
                    ],
                },
            );
            if (modifiedCount != 1) return next(new HttpError("failedUpdateMessageSeen"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };

    // ADMIN
    private adminGetMessages = async (
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

            const messages = await getPaginated(this.message, {}, skip, limit, sort, sortBy);

            res.json(messages);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminDeleteMessageById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const messageId = req.params["id"];
            if (await isIdNotValid(this.message, [messageId], next)) return;

            const { users } = await this.message //
                .findById(messageId, { users: 1 })
                .lean<{ users: Types.ObjectId[] }>()
                .exec();

            const { deletedCount } = await this.message //
                .deleteOne({ _id: messageId })
                .exec();
            if (deletedCount != 1) return next(new HttpError("failedDeleteMessage"));

            const { modifiedCount } = await this.user
                .updateMany({ _id: { $in: users } }, { $pull: { messages: messageId } })
                .exec();
            if (modifiedCount != 2) return next(new HttpError("failedUpdateUsers"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
    private adminDeleteMessageContentByMessageAndContentId = async (
        req: Request<{ id: string; contentId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const messageId = req.params["id"];
            if (await isIdNotValid(this.message, [messageId], next)) return;
            const contentId = req.params["contentId"];

            const isContentExists = await this.message //
                .exists({ _id: messageId, "message_contents._id": contentId })
                .exec();
            if (isContentExists == null) return next(new HttpError("failedGetMessageContent"));

            const { modifiedCount } = await this.message //
                .updateOne({ _id: messageId }, { $pull: { message_contents: { _id: contentId } } })
                .exec();
            if (modifiedCount != 1) return next(new HttpError("failedDeleteMessageContent"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
