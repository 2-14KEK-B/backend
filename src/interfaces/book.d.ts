import type ID from "./id";
import type { BookRating } from "./bookRating";

interface Book {
    _id: ID;
    uploader: ID;
    createdAt: Date;
    updatedAt: Date;
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

interface ModifyBook extends CreateBook {
    author?: string;
    title?: string;
    for_borrow?: boolean;
    available?: boolean;
}

interface Book extends CreateBook {
    _id: ID;
    uploader: ID;
    updated_on?: Date;
    available?: boolean;
    ratings?: BookRating[];
    __v?: number;
}

export { Book, CreateBook, ModifyBook };
