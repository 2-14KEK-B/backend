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
    { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
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
    { timestamps: true, versionKey: false },
);

export default messageSchema;
