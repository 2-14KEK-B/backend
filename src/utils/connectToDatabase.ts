import { connect, connection, Connection } from "mongoose";
import env from "./validateEnv";
import Book from "@models/book";
import Borrow from "@models/borrow";
import Message from "@models/message";
import User from "@models/user";

export default function connectToDatabase(connectionString?: string): Connection {
    const uri = connectionString || env.MONGO_URI;

    connect(uri, err => {
        if (err) {
            if (env.isProduction) console.log("Unable to connect to the server. Please use real mongo atlas uri.");
            else console.log("Unable to connect to the server. Please start MongoDB.");
        }
    });

    connection
        .once("open", () => {
            if (env.isProduction) console.log("Connected to MongoDB server.");
            else console.log(`Connected to ${uri}`);
        })
        .on("error", error => {
            console.log(`Mongoose error message: ${error.message}`);
        });

    User.init();
    Book.init();
    Borrow.init();
    Message.init();

    return connection;
}
