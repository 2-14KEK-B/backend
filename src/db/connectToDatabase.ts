import { connect, connection, set } from "mongoose";
import env from "@config/validateEnv";
import userModel from "@models/user";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import messageModel from "@models/message";
import userRatingModel from "@models/userRating";

export default async function connectToDatabase(connectionString?: string): Promise<void> {
    try {
        const uri = connectionString || env.MONGO_URI;
        await connect(uri);
        set("strictQuery", false);
        // set("debug", { shell: true });

        if (env.isProduction) {
            console.log("Connected to MongoDB server.");
        } else if (env.isDevelopment) {
            console.log(`Connected to ${uri}`);
        }

        await userModel.init();
        await bookModel.init();
        await borrowModel.init();
        await messageModel.init();
        await userRatingModel.init();

        connection.on("error", error => {
            console.log(`Mongoose error message: ${error}`);
        });
    } catch (error) {
        console.log(new Error(error));
        if (env.isProduction) console.log("Unable to connect to the server. Please use real mongo atlas uri.");
        else console.log("Unable to connect to the server. Please start MongoDB.");
    }
}
