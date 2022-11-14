import { Types } from "mongoose";

type ID = Types.ObjectId | string;

interface MessageContent {
    _id?: ID;
    sender_id: ID;
    content: string;
}

interface Message {
    _id: ID;
    users: ID[];
    message_contents: MessageContent[];
}

interface CreateMessage {
    content: string;
}

export { Message, MessageContent, CreateMessage };
