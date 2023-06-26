import type { ID, User } from ".";

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
    seen: boolean;
}

interface CreateMessageContent {
    sender_id: ID;
    content: string;
}

export type { Message, MessageContent, CreateMessageContent };
