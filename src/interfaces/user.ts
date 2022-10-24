import { Types } from "mongoose";

export default interface User {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    password: string;
}
