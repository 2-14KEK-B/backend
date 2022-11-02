import express, { Express, json } from "express";
import { connect, connection } from "mongoose";
import session, { SessionOptions } from "express-session";
import MongoStore from "connect-mongo";
import { MongoClient } from "mongodb";
import cors from "cors";
import errorMiddleware from "@middlewares/error";
import loggerMiddleware from "@middlewares/logger";
import Controller from "@interfaces/controller";

export default class App {
    public app: Express;
    private mongoClient: MongoClient;

    constructor(controllers: Controller[]) {
        this.app = express();
        this.mongoClient = this.connectToTheDatabase();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    public getServer(): Express {
        return this.app;
    }

    private initializeMiddlewares() {
        this.app.use(json());
        // Enabled CORS:
        this.app.use(
            cors({
                origin: ["http://localhost:4000", "http://127.0.0.1:4000"],
                credentials: true,
            }),
        );
        this.app.use(loggerMiddleware);
        this.initSession();
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initializeControllers(controllers: Controller[]) {
        controllers.forEach(controller => {
            this.app.use("/", controller.router);
        });
    }

    private connectToTheDatabase() {
        let connectionString: string;

        if (process.env.NODE_ENV === "development") {
            connectionString = process.env.DEV_MONGO_URI;
        } else if (process.env.NODE_ENV === "test") {
            connectionString = process.env.TEST_MONGO_URI;
        } else {
            const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH, MONGO_DB } = process.env;
            connectionString = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}${MONGO_DB}?retryWrites=true&w=majority`;
        }
        connect(connectionString, err => {
            if (err) {
                console.log("Unable to connect to the server. Please start MongoDB.");
            }
        });

        connection.on("error", error => {
            console.log(`Mongoose error message: ${error.message}`);
        });
        connection.on("connected", () => {
            console.log(`Connected to MongoDB server. :: ${connectionString}`);
        });

        return connection.getClient();
    }

    private initSession() {
        // const TOUCH_AFTER = 60 * 10; // 10mins
        const MAX_AGE = 1000 * 60 * 30; // 30mins

        const sessionStore = MongoStore.create({
            client: this.mongoClient,
            ttl: MAX_AGE,
            // touchAfter: TOUCH_AFTER
        });

        const options: SessionOptions = {
            secret: process.env.SECRET,
            name: "session-id",
            cookie: {
                maxAge: MAX_AGE,
                httpOnly: true,
                signed: true,
                sameSite: "strict",
                secure: false,
            },
            saveUninitialized: false,
            resave: true,
            store: sessionStore,
        };

        if (process.env.NODE_ENV != "development") {
            this.app.set("trust proxy", 1); // trust first proxy
            options.cookie.secure = true; // serve secure cookies
        }

        this.app.use(session(options));
    }

    public listen(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`App listening on the port ${process.env.PORT}`);
        });
    }
}
