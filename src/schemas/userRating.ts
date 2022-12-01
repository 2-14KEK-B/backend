import type { UserRating } from "@interfaces/userRating";
import { Schema } from "mongoose";

const userRatingSchema = new Schema<UserRating>({
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
    comment: String,
    rate: { type: Boolean, required: true },
});

export default userRatingSchema;
