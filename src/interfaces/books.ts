import { Document } from "mongoose";

export interface BookRating {
    _id: string;
    from_id: string;
    comment?: string;
    rating: number;
}

export default interface Book extends Document {
    _id?: string;
    created_on: Date;
    updated_on: Date;
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
