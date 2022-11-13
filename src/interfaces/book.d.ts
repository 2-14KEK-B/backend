import type { Types } from "mongoose";

type ID = Types.ObjectId | string;

interface BookRating {
    _id: string;
    from_id: string;
    comment?: string;
    rating: number;
}

interface Book {
    _id?: ID;
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
    updated_on?: Date;
    picture?: string;
    category?: string[];
    price?: number;
    for_borrow?: boolean;
    available?: boolean;
    ratings?: BookRating[];
}

export { Book, BookRating, CreateBook, ModifyBook };
