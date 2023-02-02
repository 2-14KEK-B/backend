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
    books: (Book | ID)[];
    user_ratings?: (UserRating | ID)[];
}

interface CreateBorrow {
    from_id: string;
    books: string[];
}

interface ModifyBorrow {
    books?: string[];
    verified?: boolean;
}

export { Borrow, CreateBorrow, ModifyBorrow };
