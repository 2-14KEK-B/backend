import { Post } from "@interfaces/post";
import { Schema } from "mongoose";

export const postSchema = new Schema<Post>(
    {
        author: {
            ref: "User",
            type: Schema.Types.ObjectId,
        },
        content: String,
        title: String,
    },
    { versionKey: false },
);
