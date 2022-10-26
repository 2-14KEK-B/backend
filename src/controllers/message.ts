import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import messageModel from "@models/message";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import IdNotValidException from "@exceptions/IdNotValid";
import { MessageContent } from "@interfaces/message";
import Controller from "@interfaces/controller";

export default class MessageController implements Controller {
    path = "/messages";
    router = Router();
    private message = messageModel;
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.getAllMessages);
        this.router.get(`${this.path}/:id`, this.getMessageById);
        this.router.post(this.path, this.createMessage);
        this.router.delete(`${this.path}/:id`, this.deleteMessageById);
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
            if (!Types.ObjectId.isValid(messageId)) return next(new IdNotValidException(messageId));

            const message = await this.message.findById(messageId);
            if (!message) return next(new HttpError(`Failed to get message by id ${messageId}`));

            res.send(message);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private createMessage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const messageData: { from_id: string; to_id: string; content: string } = req.body;
            const newMessageContent: MessageContent = {
                sender_id: new Types.ObjectId(messageData.from_id),
                content: messageData.content,
            };
            const messages = await this.message.findOne({ users: { $in: [messageData.from_id, messageData.to_id] } });

            if (messages) {
                messages.message_contents.push(newMessageContent);
                const newMessage = await messages.save();
                if (!newMessage) return next(new HttpError("Failed to create message"));
                // await messages
                //     .save()
                //     .then(() => res.send(newMessageContent))
                //     .catch(() => next(new HttpError("Failed to create message")));
            } else {
                const newMessage = await new this.message({
                    users: [new Types.ObjectId(messageData.from_id), new Types.ObjectId(messageData.to_id)],
                    message_contents: [newMessageContent],
                }).save();
                if (!newMessage) return next(new HttpError("Failed to create message"));

                const { acknowledged } = await this.user.updateMany(
                    { _id: { $in: [messageData.from_id, messageData.to_id] } },
                    { $push: { messages: { _id: newMessage._id } } },
                );
                if (!acknowledged) return next(new HttpError("Failed to update users"));
                // newMessage
                //     .save()
                //     .then(async doc => {
                //         // await this.user.findByIdAndUpdate(messageData.from_id, { $push: { messages: doc._id } });
                //         // await this.user.findByIdAndUpdate(messageData.to_id, { $push: { messages: doc._id } });

                //         await this.user.updateMany(
                //             { _id: { $in: [messageData.from_id, messageData.to_id] } },
                //             { $push: { messages: { _id: doc._id } } },
                //         );
                //     })
                //     .then(() => res.send(newMessageContent))
                //     .catch(() => next(new HttpError("Failed to create message")));
            }

            res.send(newMessageContent);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    private deleteMessageById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const messageId: string = req.params.id;
            if (!Types.ObjectId.isValid(messageId)) return next(new IdNotValidException(messageId));

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
