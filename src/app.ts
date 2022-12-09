import express, { Express, json, Request, Response, urlencoded } from "express";
import { createServer, Server } from "http";
import { Server as Socket } from "socket.io";
import session, { SessionOptions } from "express-session";
import cors from "cors";
import morgan from "morgan";
import { createSessionStore } from "@db/sessionStore";
import errorMiddleware from "@middlewares/error";
import env from "@config/validateEnv";
import corsOptions from "@config/corsOptions";
import StatusCode from "@utils/statusCodes";
import type Controller from "@interfaces/controller";

export default class App {
    public app: Express;
    private httpServer: Server;

    constructor(controllers: Controller[]) {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.initSession();
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
        this.app.use(cors(corsOptions));
    }

    private initializeErrorHandling() {
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
                sameSite: true,
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
        this.initSocketIO();

        this.httpServer.listen(env.PORT, () => {
            console.log(`App listening on the port ${env.PORT}`);
        });
    }

    private initSocketIO() {
        const io = new Socket(this.httpServer, { cors: corsOptions });

        let onlineUsers: { user_id: string; socket_id: string }[] = [];

        io.on("connection", socket => {
            socket.on("disconnecting", () => {
                const disconnectedId = socket.id;
                onlineUsers = onlineUsers.filter(user => user.socket_id !== disconnectedId);

                onlineUsers.forEach(user => {
                    socket.to(user.socket_id).emit(
                        "other-users",
                        onlineUsers.map(user => user.user_id),
                    );
                });
            });
            socket.on("add-user", (userId: string) => {
                socket.emit(
                    "other-users",
                    onlineUsers.map(user => user.user_id),
                );

                onlineUsers.push({ user_id: userId, socket_id: socket.id });

                socket.broadcast.emit("new-user", userId);
            });

            socket.on("send-msg", (data: { from: string; to: string; message: string }) => {
                const sendUserSocket = onlineUsers.find(user => user.user_id === data.to);
                if (sendUserSocket) {
                    socket.to(sendUserSocket.socket_id).emit("msg-recieved", data);
                }
            });
        });
    }
}
