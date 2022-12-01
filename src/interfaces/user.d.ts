import type ID from "./id";
import type { Book } from "./book";
import type { Borrow } from "./borrow";
import type { Message } from "./message";
import type { UserRating } from "./userRating";

interface CreateUser {
    username?: string;
    fullname?: string;
    email: string;
    password: string;
    locale?: string;
    picture?: string;
}

interface ModifyUser extends CreateUser {
    email_is_verified?: boolean;
    email?: string;
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
