import { model } from "mongoose";
import userSchema from "@schemas/user";
import { User } from "@interfaces/user";

const userModel = model<User>("User", userSchema, "users");

export default userModel;
