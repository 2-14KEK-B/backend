import type ID from "./id";
import type { User } from "./user";

interface Message {
    _id?: ID;
    users: (User | ID)[];
    createdAt: Date;
    updatedAt: Date;
    message_contents: MessageContent[];
}

interface MessageContent {
    _id?: ID;
    createdAt: Date;
    content: string;
    sender_id: ID;
}

interface CreateMessageContent {
    sender_id: ID;
    content: string;
}

export { Message, MessageContent, CreateMessageContent };
