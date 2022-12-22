import type ID from "./id";
import type { User } from "./user";
import type { BookRating } from "./bookRating";

interface Book {
    _id: ID;
    uploader: User | ID;
    createdAt: Date;
    updatedAt?: Date;
    author: string;
    title: string;
    picture: string;
    category: string[];
    price?: number;
    available?: boolean;
    for_borrow: boolean;
    ratings?: BookRating[];
    __v?: number;
}

interface CreateBook {
    author: string;
    title: string;
    picture?: string;
    category?: string[];
    price?: number;
    for_borrow: boolean;
}

interface ModifyBook {
    author?: string;
    title?: string;
    for_borrow?: boolean;
    available?: boolean;
    picture?: string;
    category?: string[];
    price?: number;
}

export { Book, CreateBook, ModifyBook };
