import { Model, PaginateModel, model } from "mongoose";
import bookSchema from "@schemas/book";
import type { Book } from "@interfaces/book";

interface BookModel extends PaginateModel<Book>, Model<Book> {}

const bookModel = model<Book, BookModel>("Book", bookSchema, "books");

export default bookModel;
