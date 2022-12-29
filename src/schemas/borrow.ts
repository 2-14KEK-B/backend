import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { Borrow } from "@interfaces/borrow";

const borrowSchema = new Schema<Borrow>(
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
        books: [
            {
                type: Schema.Types.ObjectId,
                ref: "Book",
                required: true,
            },
        ],
        verified: { type: Boolean, default: false },
        user_ratings: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
    },
    { timestamps: true, versionKey: false },
);

borrowSchema.plugin(paginate);

export default borrowSchema;
