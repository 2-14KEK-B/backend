import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { Borrow } from "@interfaces";

const borrowSchema = new Schema<Borrow>(
    {
        from: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "borrow.fromRequired"],
        },
        to: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "borrow.toRequired"],
        },
        type: {
            type: String,
            required: [true, "borrow.typeRequired"],
            enum: {
                values: ["borrow", "lend"],
                message: "borrow.onlyFromTypes",
            },
        },
        books: [
            {
                type: Schema.Types.ObjectId,
                ref: "Book",
                required: [true, "borrow.booksRequired"],
            },
        ],
        verified: { type: Boolean, default: false },
        user_rates: [{ type: Schema.Types.ObjectId, ref: "UserRate" }],
    },
    { timestamps: true, versionKey: false },
);

borrowSchema.plugin(paginate);

export default borrowSchema;
