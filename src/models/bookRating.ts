import { model } from "mongoose";
import bookRatingSchema from "@schemas/book";

const bookRatingModel = model("BookRating", bookRatingSchema, "bookRatings");

export default bookRatingModel;
