import type { ID, Book, UserRate } from ".";

interface Borrow {
    _id: ID;
    from: ID;
    to: ID;
    type: "borrow" | "lend";
    createdAt: Date;
    updatedAt: Date;
    verified: boolean;
    books: (Book | ID)[];
    user_rates?: (UserRate | ID)[];
}

interface CreateBorrow {
    to?: string;
    from?: string;
    books: string[];
}

interface ModifyBorrow {
    books?: string[];
}

export type { Borrow, CreateBorrow, ModifyBorrow };
