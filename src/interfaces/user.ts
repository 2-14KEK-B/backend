import { Types } from "mongoose";
import Book from "./books";
import Borrow from "./borrows";
import Message from "./messages";

export default interface User {
    _id?: Types.ObjectId;
    created_on: Date;
    updated_on: Date;
    username: string;
    full_name: string;
    password: string;
    email: string;
    email_is_verified: boolean;
    locale?: string;
    picture?: string;
    books: Book[];
    messages: Message[];
    user_ratings: Types.ObjectId[];
    borrow: Borrow[];
}
