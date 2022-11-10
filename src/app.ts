import express, { Express, json } from "express";
import { connect, connection, Connection } from "mongoose";
import session, { SessionOptions } from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import errorMiddleware from "@middlewares/error";
import loggerMiddleware from "@middlewares/logger";
import env from "@utils/validateEnv";
import type { MongoClient } from "mongodb";
import type Controller from "@interfaces/controller";

export default class App {
    public app: Express;
    public connection: Connection;

    constructor(controllers: Controller[], connectionString?: string) {
        this.app = express();
        this.connection = this.connectToTheDatabase(connectionString);
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    public getServer(): Express {
        return this.app;
    }

    public getDb(): Connection {
        return this.connection;
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
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initializeControllers(controllers: Controller[]) {
        controllers.forEach(controller => {
            this.app.use("/", controller.router);
        });
    }

    private connectToTheDatabase(connectionString?: string) {
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

        this.initSession(connection.getClient());
        return connection;
    }

    private initSession(mongoClient: MongoClient) {
        const TOUCH_AFTER = 60 * 20; // 20mins
        const MAX_AGE = 1000 * 60 * 60; // 60mins

        const sessionStore = MongoStore.create({
            client: mongoClient,
            ttl: MAX_AGE,
            touchAfter: TOUCH_AFTER,
        });

        const options: SessionOptions = {
            secret: env.SECRET,
            name: "session-id",
            cookie: {
                maxAge: MAX_AGE,
                httpOnly: true,
                signed: true,
                sameSite: "none",
                secure: "auto",
            },
            saveUninitialized: false,
            resave: true,
            store: sessionStore,
        };

        if (env.isProduction) {
            this.app.set("trust proxy", 1); // trust first proxy
            // if (options.cookie) options.cookie.secure = true; // serve secure cookies
        }

        this.app.use(session(options));
    }

    public listen(): void {
        this.app.listen(env.PORT, () => {
            console.log(`App listening on the port ${env.PORT}`);
        });
    }
}
