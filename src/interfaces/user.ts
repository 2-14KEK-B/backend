import type { ID, Book, Borrow, Message, Notification } from ".";

interface User {
    _id: ID;
    createdAt: Date;
    updatedAt?: Date;
    username: string;
    fullname: string;
    email: string;
    email_is_verified?: boolean;
    verification_token?: string;
    password_reset_token?: string;
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
    picture?: string;
    updated_on?: Date;
    email?: string;
    email_is_verified?: boolean;
    password?: string;
}

export type { User, CreateUser, ModifyUser };
