import { Schema } from "mongoose";
import type { BookRating } from "@interfaces/bookRating";

const bookRatingSchema = new Schema<BookRating>({
    from_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    comment: String,
    rating: { type: Number, required: true },
});

export default bookRatingSchema;
