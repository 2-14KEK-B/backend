import { model } from "mongoose";
import { userSchema } from "@schemas/user";
import { User } from "@interfaces/user";

export const userModel = model<User>("User", userSchema);
