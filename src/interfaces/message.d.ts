import type ID from "./id";

interface CreateMessage {
    content: string;
}

interface MessageContent extends CreateMessage {
    _id?: ID;
    createdAt: Date;
    sender_id: ID;
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
