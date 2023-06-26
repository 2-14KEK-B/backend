import { Model, type PaginateModel, model } from "mongoose";
import { bookSchema } from "@schemas";
import type { Book } from "@interfaces";

interface BookModel extends PaginateModel<Book>, Model<Book> {}

const bookModel = model<Book, BookModel>("Book", bookSchema, "books");

export default bookModel;
