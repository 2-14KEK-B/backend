import { Model, model, type PaginateModel } from "mongoose";
import { messageSchema } from "@schemas";
import type { Message } from "@interfaces";

interface MessageModel extends PaginateModel<Message>, Model<Message> {}

const messageModel = model<Message, MessageModel>("Message", messageSchema, "messages");

export default messageModel;
