import type { Types } from "mongoose";
import { BookRating } from "./bookRating";

type ID = Types.ObjectId | string;

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

interface ModifyBook {
    author?: string;
    title?: string;
    picture?: string;
    category?: string[];
    price?: number;
    for_borrow?: boolean;
    available?: boolean;
}

export { Book, CreateBook, ModifyBook };
