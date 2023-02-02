import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { UserRate } from "@interfaces/userRate";

const userRateSchema = new Schema<UserRate>(
    {
        from: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "userRate.fromRequired"],
        },
        to: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "userRate.toRequired"],
        },
        borrow: {
            type: Schema.Types.ObjectId,
            ref: "Borrow",
            required: [true, "userRate.borrowRequired"],
        },
        comment: {
            type: String,
            minLength: [1, "userRate.commentMinLength"],
            maxlength: [256, "userRate.commentMaxLength"],
        },
        rate: {
            type: Boolean,
            required: [true, "userRate.rareRequired"],
        },
    },
    { timestamps: true, versionKey: false },
);

userRateSchema.plugin(paginate);

export default userRateSchema;
