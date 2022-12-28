import { Model, model } from "mongoose";
import bookSchema from "@schemas/book";
import type { Book } from "@interfaces/book";

interface BookModel extends Model<Book> {
    findVersion(id: string, version: number, model?: Model<Book>): Promise<Book | null>;
    findValidVersion(id: string, date: Date, model?: Model<Book>): Promise<Book | null>;
}

const bookModel = model<Book, BookModel>("Book", bookSchema, "books");

export default bookModel;
