import { Schema } from "mongoose";
import User from "@interfaces/user";

const now = new Date();

const userSchema = new Schema<User>(
    {
        created_on: { type: Date, default: now },
        updated_on: { type: Date, default: now },
        username: { type: String },
        fullname: { type: String },
        password: { type: String, required: true },
        email: { type: String, required: true },
        email_is_verified: { type: Boolean, default: false },
        locale: { type: String, default: "hu-HU" },
        picture: { type: String },
        books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
        messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
        borrows: [{ type: Schema.Types.ObjectId, ref: "Borrow" }],
        user_ratings: [{ type: Schema.Types.ObjectId, refPath: "borrow.user_ratings" }],
    },
    { versionKey: false },
);

export default userSchema;
