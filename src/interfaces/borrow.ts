import { Types } from "mongoose";
import { Book } from "./book";

interface Borrow {
    _id?: Types.ObjectId;
    time: Date;
    from_id: Types.ObjectId;
    to_id: Types.ObjectId;
    books: Book[];
    verified: boolean;
    user_ratings?: [
        {
            _id?: Types.ObjectId;
            rating: boolean;
            from_id: Types.ObjectId;
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
