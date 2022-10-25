import { Types } from "mongoose";
import Book from "./book";
import Borrow from "./borrow";
import { Message } from "./message";

export default interface User {
    _id?: Types.ObjectId;
    created_on?: Date;
    updated_on?: Date;
    username: string;
    fullname: string;
    email: string;
    email_is_verified?: boolean;
    password: string;
    locale?: string;
    picture?: string;
    books: Book[];
    messages: Message[];
    user_ratings: Types.ObjectId[];
    borrows: Borrow[];
}
