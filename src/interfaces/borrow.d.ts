import { Book } from "./book";
import type ID from "./id";

interface Borrow {
    _id: ID;
    from_id: ID;
    to_id: ID;
    updated_on?: Date;
    verified: boolean;
    books: (Book | ID)[];
    user_ratings?: ID[];
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
