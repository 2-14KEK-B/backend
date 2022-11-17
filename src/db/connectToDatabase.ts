import { connect, connection } from "mongoose";
import env from "../utils/validateEnv";

export default async function connectToDatabase(connectionString?: string): Promise<void> {
    try {
        const uri = connectionString || env.MONGO_URI;
        await connect(uri);

        global.mongoConnection = connection;

        if (env.isProduction) {
            console.log("Connected to MongoDB server.");
        } else {
            console.log(`Connected to ${uri}`);
        }

        connection.on("error", error => {
            console.log(`Mongoose error message: ${error.message}`);
        });
    } catch (error) {
        console.log("error: ", error);
        if (env.isProduction) console.log("Unable to connect to the server. Please use real mongo atlas uri.");
        else console.log("Unable to connect to the server. Please start MongoDB.");
    }
}
