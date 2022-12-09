import { Schema } from "mongoose";
import type { Book } from "@interfaces/book";
import type { BookRating } from "@interfaces/bookRating";

const bookRatingSchema = new Schema<BookRating>(
    {
        from_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        comment: String,
        rate: { type: Number, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);


const bookSchema = new Schema<Book>(
    {
        uploader: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        author: { type: String, required: true },
        title: { type: String, required: true },
        picture: { type: String },
        category: [{ type: String }],
        price: { type: Number, default: 0 },
        available: { type: Boolean, default: true },
        for_borrow: { type: Boolean, required: true },
        ratings: [bookRatingSchema],
    },
    { timestamps: true },
);

export default bookSchema;
