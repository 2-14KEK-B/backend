import { model } from "mongoose";
import userSchema from "@schemas/user";

const userModel = model("User", userSchema, "users");

export default userModel;
