import { Schema } from "mongoose";
import { Message } from "@interfaces/message";

const messageSchema = new Schema<Message>(
    {
        users: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        message_contents: [
            {
                sender_id: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                time: { type: Date, default: new Date() },
                content: { type: String, required: true },
            },
        ],
    },
    { versionKey: false },
);

export default messageSchema;
