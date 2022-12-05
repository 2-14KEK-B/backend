import { Router, Request, Response, NextFunction } from "express";
import messageModel from "@models/message";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import isIdNotValid from "@utils/idChecker";
import CreateMessageDto from "@validators/message";
import HttpError from "@exceptions/Http";
import { Types } from "mongoose";
import type { CreateMessageContent, Message } from "@interfaces/message";
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
        this.router.all("*", authentication);
        this.router.get(`${this.path}/all`, authorization(["admin"]), this.getAllMessages);
        this.router
            .route(`${this.path}/:id`)
            .get(this.getMessageById)
            .post(validation(CreateMessageDto), this.createMessage)
            .delete(authorization(["admin"]), this.deleteMessageById);
    }

    private getAllMessages = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const messages = await this.message //
                .find()
                .lean<Message[]>()
                .exec();

            res.json(messages);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getMessageById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const messageId = req.params["id"];
            if (await isIdNotValid(this.message, [messageId], next)) return;

            const message = await this.message //
                .findById(messageId)
                .lean<Message>()
                .exec();
            if (!message) return next(new HttpError(`Failed to get message by id ${messageId}`));

            res.json(message);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createMessage = async (
        req: Request<{ id: string }, unknown, { content: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const from_id = req.session.userId;
            const to_id = req.params["id"];
            if (await isIdNotValid(this.user, [to_id], next)) return;

            const newMessageContent: CreateMessageContent = {
                sender_id: new Types.ObjectId(from_id),
                content: req.body.content,
            };
            let messages = await this.message //
                .findOne({ users: { $in: [from_id, to_id] } })
                .exec();

            if (messages) {
                messages.message_contents.push({ ...newMessageContent });

                const newMessage = await messages
                    .updateOne({ $push: { message_contents: { newMessageContent } } })
                    .lean<Message>()
                    .exec();
                if (!newMessage) return next(new HttpError("Failed to create message"));
            } else {
                messages = await this.message.create({
                    users: [new Types.ObjectId(from_id), new Types.ObjectId(to_id)],
                    message_contents: [newMessageContent],
                });
                if (!messages) return next(new HttpError("Failed to create message"));

                const { acknowledged } = await this.user.updateMany(
                    { _id: { $in: [from_id, to_id] } },
                    { $push: { messages: { _id: messages._id } } },
                );
                if (!acknowledged) return next(new HttpError("Failed to update users"));
            }

            res.json(messages._id);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private deleteMessageById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const messageId = req.params["id"];
            if (await isIdNotValid(this.message, [messageId], next)) return;

            const { users } = await this.message //
                .findById(messageId)
                .lean<Message>()
                .exec();
            if (!users) return next(new HttpError("Failed to get ids from messages"));

            const response = await this.message //
                .findByIdAndDelete(messageId);
            if (!response) return next(new HttpError(`Failed to delete message by id ${messageId}`));

            const { acknowledged } = await this.user.updateMany(
                { _id: { $in: users } },
                { $pull: { messages: messageId } },
            );
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
