import { Types } from "mongoose";

export interface MessageContent {
    _id?: Types.ObjectId;
    sender_id: Types.ObjectId;
    time?: Date;
    content: string;
}

export interface Message {
    _id?: Types.ObjectId;
    users: Types.ObjectId[];
    message_contents: MessageContent[];
}
