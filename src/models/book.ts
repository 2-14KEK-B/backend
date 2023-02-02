import { model } from "mongoose";
import bookSchema from "@schemas/book";

const bookModel = model("Book", bookSchema, "books");

export default bookModel;
