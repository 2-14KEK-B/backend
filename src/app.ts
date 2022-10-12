import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Controller } from "@interfaces/controller";
import errorMiddleware from "@middlewares/error";
import loggerMiddleware from "@middlewares/logger";

export default class App {
    public app: express.Application;

    constructor(controllers: Controller[]) {
        this.app = express();
        this.connectToTheDatabase();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    public listen(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`App listening on the port ${process.env.PORT}`);
        });
    }

    public getServer(): express.Application {
        return this.app;
    }

    private initializeMiddlewares() {
        this.app.use(express.json());
        this.app.use(cookieParser());
        // Enabled CORS:
        this.app.use(
            cors({
                origin: ["http://localhost:4000", "http://127.0.0.1:4000"],
                credentials: true,
                exposedHeaders: ["set-cookie"],
            }),
        );
        this.app.use(loggerMiddleware);
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initializeControllers(controllers: Controller[]) {
        controllers.forEach(controller => {
            this.app.use("/", controller.router);
        });
    }

    private async connectToTheDatabase() {
        let connectionString: string;

        if (process.env.NODE_ENV === "development") {
            connectionString = process.env.DEV_MONGO_URI;
        } else {
            const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH, MONGO_DB } = process.env;
            connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}${MONGO_DB}?retryWrites=true&w=majority`;
        }
        // Connect to MongoDB Atlas, create database if not exist::
        mongoose.connect(connectionString, err => {
            if (err) {
                console.log("Unable to connect to the server. Please start MongoDB.");
            }
        });

        mongoose.connection.on("error", error => {
            console.log(`Mongoose error message: ${error.message}`);
        });
        mongoose.connection.on("connected", () => {
            console.log("Connected to MongoDB server.");
        });
    }
}
