import { Schema } from "mongoose";
import type { Borrow } from "@interfaces/borrow";

const borrowSchema = new Schema<Borrow>({
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
    updated_on: { type: Date },
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
});

export default borrowSchema;
