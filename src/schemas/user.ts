import { Schema } from "mongoose";
import { User, Address } from "@interfaces/user";

const addressSchema = new Schema<Address>(
    {
        city: String,
        country: String,
        street: String,
    },
    { versionKey: false },
);

export const userSchema = new Schema<User>(
    {
        address: addressSchema,
        email: String,
        name: String,
        password: String,
    },
    { versionKey: false },
);
