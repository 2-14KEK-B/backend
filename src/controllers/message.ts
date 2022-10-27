import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import messageModel from "@models/message";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import { CreateMessage, MessageContent } from "@interfaces/message";
import Controller from "@interfaces/controller";
import isIdValid from "@utils/idChecker";
import authMiddleware from "@middlewares/auth";
import validationMiddleware from "@middlewares/validation";
import CreateMessageDto from "@validators/message";

export default class MessageController implements Controller {
    path = "/messages";
    router = Router();
    private message = messageModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, authMiddleware, this.getAllMessages);
        this.router.get(`${this.path}/:id`, authMiddleware, this.getMessageById);
        this.router.post(this.path, [authMiddleware, validationMiddleware(CreateMessageDto)], this.createMessage);
        this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteMessageById);
    }

    private getAllMessages = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const messages = await this.message.find();
            res.send(messages);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private getMessageById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const messageId: string = req.params.id;
            if (!(await isIdValid(this.message, [messageId], next))) return;

            const message = await this.message.findById(messageId);
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
            const messages = await this.message.findOne({ users: { $in: [from_id, to_id] } });

            if (messages) {
                messages.message_contents.push(newMessageContent);
                const newMessage = await messages.save();
                if (!newMessage) return next(new HttpError("Failed to create message"));
            } else {
                const newMessage = await this.message.create({
                    users: [new Types.ObjectId(from_id), new Types.ObjectId(to_id)],
                    message_contents: [newMessageContent],
                });
                if (!newMessage) return next(new HttpError("Failed to create message"));

                const { acknowledged } = await this.user.updateMany(
                    { _id: { $in: [from_id, to_id] } },
                    { $push: { messages: { _id: newMessage._id } } },
                );
                if (!acknowledged) return next(new HttpError("Failed to update users"));
            }

            res.send(newMessageContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteMessageById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const messageId: string = req.params.id;
            if (!(await isIdValid(this.message, [messageId], next))) return;

            const { users } = await this.message.findById(messageId);
            if (!users) return next(new HttpError("Failed to get ids from messages"));

            const response = await this.message.findByIdAndDelete(messageId);
            if (!response) return next(new HttpError(`Failed to delete message by id ${messageId}`));

            const { acknowledged } = await this.user.updateMany({ _id: { $in: users } }, { $pull: { messages: messageId } });
            if (!acknowledged) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
