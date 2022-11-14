import express, { Express, json, Request, Response, urlencoded } from "express";
import session, { SessionOptions } from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import morgan from "morgan";
import errorMiddleware from "@middlewares/error";
import env from "@utils/validateEnv";
import StatusCode from "@utils/statusCodes";
import type { MongoClient } from "mongodb";
import type Controller from "@interfaces/controller";

export default class App {
    public app: Express;

    constructor(controllers: Controller[], mongoClient: MongoClient) {
        this.app = express();
        this.initSession(mongoClient);
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    public getServer(): Express {
        return this.app;
    }

    private initializeMiddlewares() {
        if (env.isDev) this.app.use(morgan("| :date[iso] | :method | :url | :status | :response-time ms |"));
        if (env.isProd) this.app.use(morgan("tiny"));

        this.app.use(json());
        this.app.use(urlencoded({ extended: true }));
        this.app.use(
            cors({
                origin: [
                    "http://localhost:4000",
                    "http://127.0.0.1:4000",
                    "https://bookswap.onrender.com",
                    "18.156.158.53",
                    "18.156.42.200",
                    "52.59.103.54",
                ],
                credentials: true,
            }),
        );
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initializeControllers(controllers: Controller[]) {
        this.app.get("/healthcheck", (_req: Request, res: Response) => res.sendStatus(StatusCode.NoContent));
        controllers.forEach(controller => {
            this.app.use("/", controller.router);
        });
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
            this.app.set("trust proxy", 1);
        }

        this.app.use(session(options));
    }

    public listen(): void {
        this.app.listen(env.PORT, () => {
            console.log(`App listening on the port ${env.PORT}`);
        });
    }
}
