import { Schema } from "mongoose";
import type { User } from "@interfaces/user";

// const userRating = new Schema({
//     user_id: {
//         type: Schema.Types.ObjectId,
//         ref: "User",
//     },
//     comment: String,
//     rate: { type: Boolean, required: true },
// });

const userSchema = new Schema<User>(
    {
        username: { type: String },
        fullname: { type: String },
        password: { type: String, required: true },
        email: { type: String, required: true },
        email_is_verified: { type: Boolean, default: false },
        updated_on: { type: Date },
        locale: { type: String, default: "hu-HU" },
        picture: { type: String },
        role: { type: String },
        books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
        rated_books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
        messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
        borrows: [{ type: Schema.Types.ObjectId, ref: "Borrow" }],
        user_ratings: {
            // { type: Schema.Types.ObjectId, ref: "UserRating" },
            from_me: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
            to_me: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
        },
    },
    { versionKey: false },
);

export default userSchema;
