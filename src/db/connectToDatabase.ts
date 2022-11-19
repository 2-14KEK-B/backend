import { connect, connection } from "mongoose";
import env from "../utils/validateEnv";
import userModel from "@models/user";
import bookModel from "@models/book";
import bookRatingModel from "@models/bookRating";
import borrowModel from "@models/borrow";
import messageModel from "@models/message";
import { createSessionStore } from "./sessionStore";

export default async function connectToDatabase(connectionString?: string): Promise<void> {
    try {
        const uri = connectionString || env.MONGO_URI;
        await connect(uri);

        if (env.isProduction) {
            console.log("Connected to MongoDB server.");
        } else if (env.isDevelopment) {
            console.log(`Connected to ${uri}`);
        }

        await userModel.init();
        await bookModel.init();
        await bookRatingModel.init();
        await borrowModel.init();
        await messageModel.init();

        await createSessionStore(uri);

        connection.on("error", error => {
            console.log(`Mongoose error message: ${error}`);
        });
    } catch (error) {
        console.log("error: ", error);
        if (env.isProduction) console.log("Unable to connect to the server. Please use real mongo atlas uri.");
        else console.log("Unable to connect to the server. Please start MongoDB.");
    }
}
