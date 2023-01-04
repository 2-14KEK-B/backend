import { Schema } from "mongoose";
import type { User } from "@interfaces/user";
import paginate from "mongoose-paginate-v2";

const userSchema = new Schema<User>(
    {
        username: { type: String },
        fullname: { type: String },
        password: { type: String, required: true, select: 0 },
        email: { type: String, required: true },
        email_is_verified: { type: Boolean, default: false },
        locale: { type: String, default: "hu-HU" },
        picture: { type: String },
        role: { type: String },
        books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
        rated_books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
        messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
        borrows: [{ type: Schema.Types.ObjectId, ref: "Borrow" }],
        user_rates: {
            from: [{ type: Schema.Types.ObjectId, ref: "UserRate" }],
            to: [{ type: Schema.Types.ObjectId, ref: "UserRate" }],
        },
    },
    { timestamps: true, versionKey: false },
);

userSchema.statics["getInitialData"] = async function (userId: string): Promise<User> {
    try {
        return await this.findById<User>(userId)
            .populate(["books"])
            .populate({
                path: "rated_books",
                select: "picture author title",
            })
            .populate({
                path: "borrows",
                populate: [
                    {
                        path: "from to",
                        select: "fullname username email picture",
                    },
                    {
                        path: "books",
                        select: "author title picture",
                    },
                    {
                        path: "user_rates",
                        select: "-from -to -borrow",
                    },
                ],
            })
            .populate({
                path: "messages",
                options: {
                    projection: {
                        message_contents: { $slice: -25 },
                    },
                },
                populate: {
                    path: "users",
                    select: "fullname username email picture",
                },
            })
            .populate({
                path: "user_rates",
                populate: [
                    {
                        path: "from",
                        select: "-from",
                        populate: { path: "to", select: "username fullname picture email" },
                    },
                    {
                        path: "to",
                        select: "-to",
                        populate: {
                            path: "from",
                            select: "username fullname picture email",
                        },
                    },
                ],
            })
            .exec();
    } catch (error) {
        /* istanbul ignore next */
        throw new Error(error.message);
    }
};

userSchema.plugin(paginate);

export default userSchema;
