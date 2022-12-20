import type ID from "./id";

interface CreateUserRating {
    comment?: string;
    rate: boolean;
}

interface UserRating {
    _id?: ID;
    from_id: ID;
    to_id: ID;
    comment?: string;
    rate: boolean;
    borrow_id: ID;
    createdAt: Date;
}

export { UserRating, CreateUserRating };
