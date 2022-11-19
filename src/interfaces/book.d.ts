import type { Types } from "mongoose";

type ID = Types.ObjectId | string;

interface BookRating {
    from_id: ID;
    rate: number;
    comment?: string;
}

interface CreateBookRating {
    rate: number;
    comment?: string;
}

interface Book {
    _id: ID;
    uploader: ID;
    updated_on?: Date;
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

export { Book, CreateBook, ModifyBook, BookRating, CreateBookRating };
