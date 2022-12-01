import type ID from "./id";

interface CreateBookRating {
    rate: number;
    comment?: string;
}

interface BookRating extends CreateBookRating {
    _id?: ID;
    from_id: ID;
}

export { BookRating, CreateBookRating };
