import type ID from "./id";
import type { Book } from "./book";
import type { UserRate } from "./userRate";

interface Borrow {
    _id: ID;
    from: ID;
    to: ID;
    createdAt: Date;
    updatedAt: Date;
    verified: boolean;
    books: (Book | ID)[];
    user_rates?: (UserRate | ID)[];
}

interface CreateBorrow {
    from: string;
    books: string[];
}

interface ModifyBorrow {
    books?: string[];
}

export { Borrow, CreateBorrow, ModifyBorrow };
