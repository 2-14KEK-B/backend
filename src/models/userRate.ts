import { Model, model, type PaginateModel } from "mongoose";
import { userRateSchema } from "@schemas";
import type { UserRate } from "@interfaces";

interface UserRateModel extends PaginateModel<UserRate>, Model<UserRate> {}

const userRateModel = model<UserRate, UserRateModel>("UserRate", userRateSchema, "user_rates");

export default userRateModel;
