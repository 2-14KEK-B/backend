import { Schema } from "mongoose";
import Book from "@interfaces/book";

const now = new Date();

const bookSchema = new Schema<Book>({
    created_on: { type: Date, default: now },
    updated_on: { type: Date, default: now },
    author: { type: String, required: true },
    title: { type: String, required: true },
    picture: { type: String, required: true },
    category: [{ type: String, required: true }],
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
            rating: { type: Number, required: true },
        },
    ],
});

export default bookSchema;
