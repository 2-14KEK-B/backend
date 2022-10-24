import { Document, Types } from "mongoose";
import Book from "./books";

export default interface Borrow extends Document {
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
