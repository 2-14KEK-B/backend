import { Model, model, PaginateModel } from "mongoose";
import userRateSchema from "@schemas/userRate";
import type { UserRate } from "@interfaces/userRate";

interface UserRateModel extends PaginateModel<UserRate>, Model<UserRate> {}

const userRateModel = model<UserRate, UserRateModel>("UserRate", userRateSchema, "user_rates");

export default userRateModel;
