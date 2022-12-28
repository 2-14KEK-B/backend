import type ID from "./id";
import type { Book } from "./book";
import type { UserRating } from "./userRating";

interface Borrow {
    _id: ID;
    from_id: ID;
    to_id: ID;
    createdAt: Date;
    updatedAt: Date;
    verified: boolean;
    books: (Book | { _id: ID; _version: number })[];
    user_ratings?: (UserRating | ID)[];
}

interface CreateBorrow {
    from_id: string;
    books: { _id: ID; _version: number }[];
}

interface ModifyBorrow {
    books?: { _id: ID; _version: number }[];
    verified?: boolean;
}

export { Borrow, CreateBorrow, ModifyBorrow };
