import { Types } from "mongoose";

type ID = Types.ObjectId | string;

interface MessageContent {
    _id?: ID;
    createdAt?: Date;
    sender_id: ID;
    content: string;
}

interface Message {
    _id: ID;
    users: ID[];
    createdAt: Date;
    updatedAt: Date;
    message_contents: MessageContent[];
}

interface CreateMessageContent {
    sender_id: ID;
    content: string;
}

export { Message, MessageContent, CreateMessageContent };
