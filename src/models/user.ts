import { Model, model } from "mongoose";
import userSchema from "@schemas/user";
import type { User } from "@interfaces/user";

interface Static extends Model<User> {
    getInitialData(userId: string): Promise<User>;
}

const userModel = model<User, Static>("User", userSchema, "users");

export default userModel;
