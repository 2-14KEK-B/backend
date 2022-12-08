import type ID from "./id";

interface CreateUserRating {
    comment?: string;
    rate: boolean;
}

interface UserRating extends CreateUserRating {
    _id?: ID;
    from_id: ID;
    to_id: ID;
    borrow_id: ID;
    createdAt: Date;
}

export { UserRating, CreateUserRating };
