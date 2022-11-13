import { Schema } from "mongoose";
import type { Message, MessageContent } from "@interfaces/message";

const messageContentSchema = new Schema<MessageContent>(
    {
        sender_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: { type: String, required: true },
    },
    { versionKey: false },
);

const messageSchema = new Schema<Message>(
    {
        users: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        message_contents: [messageContentSchema],
    },
    { versionKey: false },
);

export default messageSchema;
