import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { Borrow } from "@interfaces/borrow";

const borrowSchema = new Schema<Borrow>(
    {
        from: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
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
        user_rates: [{ type: Schema.Types.ObjectId, ref: "UserRate" }],
    },
    { timestamps: true, versionKey: false },
);

borrowSchema.plugin(paginate);

export default borrowSchema;
