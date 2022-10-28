import { Schema } from "mongoose";
import { Borrow } from "@interfaces/borrow";

const borrowSchema = new Schema<Borrow>(
    {
        time: {
            type: Date,
            required: true,
        },
        from_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        books: [
            {
                type: Schema.Types.ObjectId,
                ref: "Book",
                required: true,
            },
        ],
        verified: { type: Boolean, default: false },
        user_ratings: [
            {
                rating: { type: Boolean, required: true },
                from_id: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                comment: String,
            },
        ],
    },
    { versionKey: false },
);

export default borrowSchema;
