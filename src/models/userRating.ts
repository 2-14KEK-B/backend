import { model } from "mongoose";
import userRatingSchema from "@schemas/userRating";

const userRatingModel = model("UserRating", userRatingSchema, "user_ratings");

export default userRatingModel;
