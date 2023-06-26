import { connect, connection, set } from "mongoose";
import env from "@config/validateEnv";
import { userModel, bookModel, borrowModel, messageModel, userRateModel } from "@models";

export default async function connectToDatabase(connectionString?: string): Promise<void> {
    try {
        const uri = connectionString || env.MONGO_URI;
        set("strictQuery", false);
        // set("debug", { shell: true });
        await connect(uri);

        if (env.isProduction) {
            console.log("Connected to MongoDB server.");
        } else if (env.isDevelopment) {
            console.log(`Connected to ${uri}`);
        }

        await userModel.init();
        await bookModel.init();
        await borrowModel.init();
        await messageModel.init();
        await userRateModel.init();

        connection.on("error", error => {
            console.log(`Mongoose error message: ${error}`);
        });
    } catch (error) {
        console.log(new Error(error));
        if (env.isProduction) console.log("Unable to connect to the server. Please use real mongo atlas uri.");
        else console.log("Unable to connect to the server. Please start MongoDB.");
    }
}
