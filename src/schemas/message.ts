import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { Message, MessageContent } from "@interfaces/message";

/**
 * new Schema<Message>(
    {
        users: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        createdAt: Date,
        updatedAt: Date,
        message_contents: [{
            sender_id: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            createdAt: Date,
            updatedAt: Date,
            content: { type: String, required: true },
            seen: { type: Boolean, default: false },
        }],
    })
 */

const messageContentSchema = new Schema<MessageContent>(
    {
        sender_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: { type: String, required: true },
        seen: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false },
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

messageSchema.plugin(paginate);

export default messageSchema;
