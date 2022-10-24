import { Schema } from "mongoose";
import User from "@interfaces/user";

const userSchema = new Schema<User>(
    {
        email: String,
        name: String,
        password: String,
    },
    { versionKey: false },
);

export default userSchema;
