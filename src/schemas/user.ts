import { Schema } from "mongoose";
import type { User } from "@interfaces/user";

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
        user_ratings: {
            from_me: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
            to_me: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
        },
    },
    { timestamps: true, versionKey: false },
);

export default userSchema;
