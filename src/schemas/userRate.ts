import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { UserRate } from "@interfaces/userRate";

const userRateSchema = new Schema<UserRate>(
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
        borrow: {
            type: Schema.Types.ObjectId,
            ref: "Borrow",
            required: true,
        },
        comment: String,
        rate: { type: Boolean, required: true },
    },
    { timestamps: true, versionKey: false },
);

userRateSchema.plugin(paginate);

export default userRateSchema;
