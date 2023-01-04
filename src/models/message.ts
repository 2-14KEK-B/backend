import { Model, model, PaginateModel } from "mongoose";
import messageSchema from "@schemas/message";
import type { Message } from "@interfaces/message";

interface MessageModel extends PaginateModel<Message>, Model<Message> {}

const messageModel = model<Message, MessageModel>("Message", messageSchema, "messages");

export default messageModel;
