import type ID from "./id";

interface CreateMessage {
    content: string;
}

interface MessageContent extends CreateMessage {
    _id?: ID;
    sender_id: ID;
}

interface Message {
    _id: ID;
    users: ID[];
    message_contents: MessageContent[];
}

export { Message, MessageContent, CreateMessage };
