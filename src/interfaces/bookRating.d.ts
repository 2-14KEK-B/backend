import type ID from "./id";

interface BookRating {
    _id?: ID;
    from_id: ID;
    createdAt: Date;
    updatedAt?: Date;
    comment?: string;
    rate: number;
}

interface CreateOrModifyBookRating {
    rate: number;
    comment?: string;
}

interface BookRating extends CreateBookRating {
    _id?: ID;
    from_id: ID;
}

export { BookRating, CreateOrModifyBookRating };
