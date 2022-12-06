import { Types } from "mongoose";
import { Book } from "./book";

type ID = Types.ObjectId | string;

interface Borrow {
    _id: ID;
    from_id: ID;
    createdAt: Date;
    updatedAt: Date;
    to_id: ID;
    books: (Book | ID)[];
    verified: boolean;
    user_ratings?: [
        {
            _id?: ID;
            rating: boolean;
            from_id: ID;
            comment: string;
        },
    ];
}

interface CreateBorrow {
    from_id: string;
    books: string[];
}

interface ModifyBorrow {
    books?: string[];
    verified?: boolean;
}

interface UserRating {
    rating: boolean;
    comment?: string;
}

export { Borrow, CreateBorrow, ModifyBorrow, UserRating };
