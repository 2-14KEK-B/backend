import { Schema } from "mongoose";
import Message from "@interfaces/messages";

const messageSchema = new Schema<Message>({
    users: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    messages_contents: [
        {
            sender_id: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            time: Date,
            content: { type: String, required: true },
        },
    ],
});

export default messageSchema;
