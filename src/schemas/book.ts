import { Schema } from "mongoose";
import type { Book } from "@interfaces/book";

const bookSchema = new Schema<Book>({
    uploader: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    updated_on: { type: Date },
    author: { type: String, required: true },
    title: { type: String, required: true },
    picture: { type: String },
    category: [{ type: String }],
    price: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    for_borrow: { type: Boolean, required: true },
    ratings: [
        {
            from_id: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
            comment: String,
            rate: { type: Number, required: true },
        },
    ],
});

export default bookSchema;
