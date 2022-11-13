import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import messageModel from "@models/message";
import authentication from "@middlewares/authentication";
import authorization from "@middlewares/authorization";
import validation from "@middlewares/validation";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import isIdValid from "@utils/idChecker";
import CreateMessageDto from "@validators/message";
import HttpError from "@exceptions/Http";
import type { CreateMessage, MessageContent } from "@interfaces/message";
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
        this.router.get(`${this.path}/:id`, this.getMessageById);
        this.router.post(this.path, validation(CreateMessageDto), this.createMessage);
        this.router.delete(`${this.path}/:id`, authorization(["admin"]), this.deleteMessageById);
    }

    private getAllMessages = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const messages = await this.message.find().lean();
            res.send(messages);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getMessageById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const messageId = req.params["id"];
            if (!(await isIdValid(this.message, [messageId], next))) return;

            const message = await this.message.findById(messageId).lean();
            if (!message) return next(new HttpError(`Failed to get message by id ${messageId}`));

            res.send(message);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private createMessage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { from_id, to_id, content }: CreateMessage = req.body;
            if (!(await isIdValid(this.user, [from_id, to_id], next))) return;

            const newMessageContent: MessageContent = {
                sender_id: new Types.ObjectId(from_id),
                content: content,
            };
            let messages = await this.message.findOne({ users: { $in: [from_id, to_id] } });

            if (messages) {
                messages.message_contents.push(newMessageContent);
                // const newMessage = await messages.save();
                const newMessage = await messages.updateOne({ $push: { message_contents: { newMessageContent } } }).lean();
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

            res.json(messages);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteMessageById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const messageId = req.params["id"];
            if (!(await isIdValid(this.message, [messageId], next))) return;

            const message = await this.message.findById(messageId);
            if (!message?.users) return next(new HttpError("Failed to get ids from messages"));

            const response = await this.message.findByIdAndDelete(messageId);
            if (!response) return next(new HttpError(`Failed to delete message by id ${messageId}`));

            const { acknowledged } = await this.user.updateMany({ _id: { $in: message.users } }, { $pull: { messages: messageId } });
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
