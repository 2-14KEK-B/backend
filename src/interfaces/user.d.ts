import type { Types } from "mongoose";
import type { Book } from "./book";
import type { Borrow } from "./borrow";
import type { Message } from "./message";

type ID = Types.ObjectId | string;

interface User {
    _id?: ID;
    updated_on?: Date;
    username: string;
    fullname: string;
    email: string;
    email_is_verified?: boolean;
    password?: string;
    locale?: string;
    picture?: string;
    role?: string;
    books: Book[];
    messages: Message[];
    user_ratings: ID[];
    borrows: Borrow[];
}

interface CreateUser {
    username?: string;
    fullname?: string;
    email: string;
    password: string;
    locale?: string;
    picture?: string;
}

interface ModifyUser {
    username?: string;
    fullname?: string;
    updated_on?: Date;
    email?: string;
    email_is_verified?: boolean;
    password?: string;
    locale?: string;
    picture?: string;
}

export { User, CreateUser, ModifyUser };
