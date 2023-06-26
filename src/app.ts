import express, { type Application, json, type Request, type Response, urlencoded } from "express";
import { createServer, Server } from "http";
import session, { type SessionOptions } from "express-session";
import cors from "cors";
import { I18n } from "i18n";
import { join } from "node:path";
import morgan from "morgan";
import { initSocket } from "./socket";
import { createSessionStore } from "@db/sessionStore";
import { mongooseErrorMiddleware, errorMiddleware } from "@middlewares";
import env from "@config/validateEnv";
import corsOptions from "@config/corsOptions";
import StatusCode from "@utils/statusCodes";
import type { Controller } from "@interfaces";

class App {
    public app: Application;
    private server: Server;

    constructor(controllers: Controller[]) {
        this.app = express();
        this.server = createServer(this.app);
        this.initSession();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    public getApp(): Application {
        return this.app;
    }

    private initLanguage() {
        const i18n = new I18n();

        i18n.configure({
            locales: ["en", "hu"],
            defaultLocale: "hu",
            directory: join(__dirname, "/locales"),
            objectNotation: true,
        });

        this.app.use(i18n.init);
    }

    private initializeMiddlewares() {
        if (env.isDev) this.app.use(morgan("| :date[iso] | :method | :url | :status | :response-time ms |"));
        if (env.isProd) this.app.use(morgan("tiny"));

        this.app.disable("x-powered-by");
        this.app.use((_req, res, next) => {
            res.setHeader(
                "Content-Security-Policy",
                "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
            );
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
            res.setHeader("Origin-Agent-Cluster", "?1");
            res.setHeader("Referrer-Policy", "no-referrer");
            res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-DNS-Prefetch-Control", "off");
            res.setHeader("X-Download-Options", "noopen");
            res.setHeader("X-Frame-Options", "SAMEORIGIN");
            res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
            res.setHeader("X-XSS-Protection", "0");
            next();
        });

        this.app.use(json());
        this.app.use(urlencoded({ extended: false }));
        this.app.use(cors(corsOptions));
        this.initLanguage();
    }

    private initializeErrorHandling() {
        this.app.use(mongooseErrorMiddleware);
        this.app.use(errorMiddleware);
    }

    private initializeControllers(controllers: Controller[]) {
        this.app.get("/healthcheck", (_req: Request, res: Response) => res.sendStatus(StatusCode.OK));
        controllers.forEach(controller => {
            this.app.use("/", controller.router);
        });
    }

    private initSession() {
        const MAX_AGE = 1000 * 60 * 60;
        const uri = process.env["TEST_URI"] || env.MONGO_URI;
        const sessionStore = createSessionStore(MAX_AGE, uri);

        const options: SessionOptions = {
            secret: env.SECRET,
            name: "session-id",
            cookie: {
                maxAge: MAX_AGE,
                httpOnly: true,
                signed: true,
                sameSite: "strict",
                secure: "auto",
            },
            saveUninitialized: false,
            resave: true,
            store: sessionStore,
        };

        if (env.isProduction) {
            this.app.set("trust proxy", 1);
            if (options.cookie) options.cookie.sameSite = "none";
        }

        this.app.use(session(options));
    }

    public listen(): void {
        this.server.listen(env.PORT, () => {
            console.log(`App listening on the port ${env.PORT}`);
        });
    }

    public initSocketIO() {
        const io = initSocket(this.server);
        this.app.io = io;
    }
}

export default App;
