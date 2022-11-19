import type { Types } from "mongoose";

type ID = Types.ObjectId | string;

interface BookRating {
    _id: ID;
    from_id: ID;
    comment?: string;
    rating: number;
}

interface CreateBookRating {
    from_id?: ID;
    rating: number;
    comment?: string;
}

export { BookRating, CreateBookRating };
