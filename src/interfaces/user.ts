import { Types } from "mongoose";

export interface Address {
    _id?: Types.ObjectId;
    city: string;
    country: string;
    street: string;
}

export interface User {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    address?: Address;
}
