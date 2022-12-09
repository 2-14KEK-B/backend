import type { UserRating } from "@interfaces/userRating";
import { Schema } from "mongoose";

const userRatingSchema = new Schema<UserRating>(
    {
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
        borrow_id: {
            type: Schema.Types.ObjectId,
            ref: "Borrow",
            required: true,
        },
        comment: String,
        rate: { type: Boolean, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

export default userRatingSchema;
