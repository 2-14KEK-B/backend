import { Types } from "mongoose";
import Book from "./book";

export default interface Borrow {
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
