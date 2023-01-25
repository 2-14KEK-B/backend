import type ID from "./id";
import type { Book } from "./book";
import type { Borrow } from "./borrow";
import type { Message } from "./message";
import type { Notification } from "./notification";

type ID = Types.ObjectId | string;

interface User {
    _id: ID;
    createdAt: Date;
    updatedAt?: Date;
    username: string;
    fullname: string;
    email: string;
    email_is_verified?: boolean;
    password?: string;
    locale?: string;
    picture?: string;
    role?: string;
    books: (Book | ID)[];
    messages: (Message | ID)[];
    rated_books: (Book | ID)[];
    user_rates: { from: ID[]; to: ID[] };
    borrows: (Borrow | ID)[];
    notifications: Notification[];
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
}

export { User, CreateUser, ModifyUser };
