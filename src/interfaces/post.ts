import { Types } from "mongoose";

export interface Post {
    _id?: Types.ObjectId;
    author: Types.ObjectId;
    content: string;
    title: string;
}
