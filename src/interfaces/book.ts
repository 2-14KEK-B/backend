import type { ID, User, BookRate } from ".";

interface Book {
    _id: ID;
    uploader: User | ID;
    isbn: string;
    createdAt: Date;
    updatedAt?: Date;
    author: string;
    title: string;
    picture: string;
    category: string[];
    price?: number;
    available?: boolean;
    for_borrow: boolean;
    rates?: BookRate[];
    __v?: number;
}

interface CreateBook {
    author: string;
    title: string;
    isbn?: string;
    picture?: string;
    category?: string[];
    price?: number;
    for_borrow: boolean;
}

interface ModifyBook {
    author?: string;
    title?: string;
    isbn: string;
    for_borrow?: boolean;
    available?: boolean;
    picture?: string;
    category?: string[];
    price?: number;
}

export type { Book, CreateBook, ModifyBook };
