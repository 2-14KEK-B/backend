import type ID from "./id";

interface BookRating {
    _id?: ID;
    from_id: ID;
    createdAt: Date;
    comment?: string;
    rate: number;
}

interface CreateBookRating {
    rate: number;
    comment?: string;
}

interface BookRating extends CreateBookRating {
    _id?: ID;
    from_id: ID;
}

export { BookRating, CreateBookRating };
