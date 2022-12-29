import { Model, model, PaginateModel } from "mongoose";
import userSchema from "@schemas/user";
import type { User } from "@interfaces/user";

interface UserModel extends PaginateModel<User>, Model<User> {
    getInitialData(userId: string): Promise<User>;
}

const userModel = model<User, UserModel>("User", userSchema, "users");

export default userModel;
