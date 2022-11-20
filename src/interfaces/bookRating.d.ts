import type { Types } from "mongoose";

type ID = Types.ObjectId | string;

interface BookRating {
    _id?: ID;
    from_id: ID;
    comment?: string;
    rate: number;
}

interface CreateBookRating {
    from_id?: ID;
    rate: number;
    comment?: string;
}

export { BookRating, CreateBookRating };
