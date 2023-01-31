import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { Message, MessageContent } from "@interfaces/message";

const messageContentSchema = new Schema<MessageContent>(
    {
        sender_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "message.senderRequired"],
        },
        content: {
            type: String,
            minlength: [1, "message.contentMinLength"],
            maxlength: [256, "message.contentMaxLength"],
            required: [true, "message.contentRequired"],
        },
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
                required: [true, ""],
            },
        ],
        message_contents: [messageContentSchema],
    },
    { timestamps: true, versionKey: false },
);

messageSchema.plugin(paginate);

export default messageSchema;
