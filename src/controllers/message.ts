import { Router, Request, Response, NextFunction } from "express";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import messageModel from "@models/message";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import isIdNotValid from "@utils/idChecker";
import sortByDateAndSlice from "@utils/sortByDateAndSlice";
import CreateMessageDto from "@validators/message";
import HttpError from "@exceptions/Http";
import { SortOrder, Types } from "mongoose";
import type { CreateMessageContent, Message, MessageContent } from "@interfaces/message";
import type Controller from "@interfaces/controller";

export default class MessageController implements Controller {
    path = "/message";
    router = Router();
    private message = messageModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.all(`${this.path}/*`, authentication);
        this.router.get(`${this.path}/all`, authorization(["admin"]), this.getAllMessages);
        this.router.get(this.path, this.getMessageByUserIds);
        this.router
            .route(`${this.path}/:id([0-9a-fA-F]{24})`)
            .get(this.getMessagesById)
            .post(validation(CreateMessageDto), this.createMessage)
            .delete(authorization(["admin"]), this.deleteMessageById);
    }

    private getAllMessages = async (
        req: Request<unknown, unknown, unknown, { skip?: string; limit?: string; sort?: SortOrder; sortBy?: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { skip, limit, sort, sortBy } = req.query;

            let sortQuery: { [_ in keyof Partial<Message>]: SortOrder } | string = {
                createdAt: sort || "desc",
            };
            if (sort && sortBy) {
                sortQuery = `${sort == "asc" ? "" : "-"}${sortBy}`;
            }

            const messages = await this.message //
                .find()
                .sort(sortQuery)
                .skip(Number.parseInt(skip as string) || 0)
                .limit(Number.parseInt(limit as string) || 10)
                .lean<Message[]>()
                .exec();

            res.json(messages);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getMessagesById = async (
        req: Request<{ id: string }, unknown, unknown, { skip?: string; limit?: string; sort?: SortOrder }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const messageId = req.params["id"];
            if (await isIdNotValid(this.message, [messageId], next)) return;

            const { skip, limit, sort } = req.query;

            const { message_contents } = await this.message //
                .findById(messageId, { message_contents: 1 })
                .lean<{ message_contents: MessageContent[] }>()
                .exec();
            if (!message_contents) return next(new HttpError(`Failed to get message by id ${messageId}`));

            const sortedMessages = sortByDateAndSlice(message_contents, sort || "asc", skip, limit);

            res.json(sortedMessages);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getMessageByUserIds = async (
        req: Request<unknown, unknown, unknown, { skip?: string; limit?: string; sort?: SortOrder; userId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const loggedInUserId = req.session["userId"];

            const { skip, limit, sort, userId } = req.query;
            if (await isIdNotValid(this.user, [userId, loggedInUserId], next)) return;

            const { message_contents } = await this.message
                .findOne(
                    { users: { $in: [loggedInUserId, userId] } }, //
                    { message_contents: 1 },
                )
                .lean<{ message_contents: MessageContent[] }>()
                .exec();
            if (!message_contents) return next(new HttpError(`Failed to get message by given user ids`));

            const sortedMessages = sortByDateAndSlice(message_contents, sort, skip, limit);

            res.json(sortedMessages);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private createMessage = async (
        req: Request<{ id: string }, unknown, { content: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const from_id = req.session["userId"];
            const to_id = req.params["id"];
            if (await isIdNotValid(this.user, [to_id], next)) return;

            const query = { $all: [from_id, to_id] };

            const newMessageContent: CreateMessageContent = {
                sender_id: new Types.ObjectId(from_id),
                content: req.body.content,
            };
            let messages = await this.message //
                .exists({ users: query })
                .exec();

            if (messages) {
                const { acknowledged } = await this.message
                    .updateOne({ users: query }, { $push: { message_contents: { ...newMessageContent } } })
                    .exec();
                if (!acknowledged) return next(new HttpError("Failed to add message content"));
                res.json({ ...newMessageContent, createdAt: new Date() });
            } else {
                messages = await this.message.create({
                    users: [new Types.ObjectId(from_id), new Types.ObjectId(to_id)],
                    message_contents: [newMessageContent],
                });
                if (!messages) return next(new HttpError("Failed to create message"));

                const { acknowledged } = await this.user
                    .updateMany({ _id: query }, { $push: { messages: { _id: messages._id } } })
                    .exec();
                if (!acknowledged) return next(new HttpError("Failed to update users"));

                return res.json(messages);
            }
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteMessageById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const messageId = req.params["id"];
            if (await isIdNotValid(this.message, [messageId], next)) return;

            const { users } = await this.message //
                .findById(messageId, { users: 1 })
                .lean<{ users: Types.ObjectId[] }>()
                .exec();
            if (!users) return next(new HttpError("Failed to get ids from messages"));

            const { acknowledged: successfullDeleteMessage } = await this.message //
                .deleteOne({ _id: messageId })
                .exec();
            if (!successfullDeleteMessage) return next(new HttpError(`Failed to delete message by id ${messageId}`));

            const { acknowledged: successfullUpdateUsers } = await this.user
                .updateMany({ _id: { $in: users } }, { $pull: { messages: messageId } })
                .exec();
            if (!successfullUpdateUsers) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
