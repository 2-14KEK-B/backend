import { Types } from "mongoose";

interface MessageContent {
    _id?: Types.ObjectId;
    sender_id: Types.ObjectId;
    time?: Date;
    content: string;
}

interface Message {
    _id?: Types.ObjectId;
    users: Types.ObjectId[];
    message_contents: MessageContent[];
}

interface CreateMessage {
    from_id: string;
    to_id: string;
    content: string;
}

export { Message, MessageContent, CreateMessage };
