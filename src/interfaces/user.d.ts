import type ID from "./id";
import type { Book } from "./book";
import type { Borrow } from "./borrow";
import type { Message } from "./message";

type ID = Types.ObjectId | string;

interface User {
    _id: ID;
    createdAt: Date;
    updatedAt: Date;
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
    rated_books: ID[];
    user_ratings: ID[];
    borrows: (Borrow | ID)[];
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

interface User extends CreateUser {
    _id: ID;
    updated_on?: Date;
    email_is_verified?: boolean;
    role?: string;
    books: (Book | ID)[];
    messages: (Message | ID)[];
    rated_books: ID[];
    borrows: (Borrow | ID)[];
    user_ratings: { from_me: (UserRating | ID)[]; to_me: (UserRating | ID)[] };
}

export { User, CreateUser, ModifyUser };
