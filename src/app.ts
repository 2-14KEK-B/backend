import express, { Application, json, Request, Response, urlencoded } from "express";
import { Server as Socket } from "socket.io";
import { createServer, Server } from "http";
import session, { SessionOptions } from "express-session";
import cors from "cors";
import morgan from "morgan";
import { createSessionStore } from "@db/sessionStore";
import errorMiddleware from "@middlewares/error";
import env from "@config/validateEnv";
import corsOptions from "@config/corsOptions";
import StatusCode from "@utils/statusCodes";
import type Controller from "@interfaces/controller";
import type { Message, MessageContent } from "@interfaces/message";

export default class App {
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

    public getServer(): Application {
        return this.app;
    }

    private initializeMiddlewares() {
        if (env.isDev) this.app.use(morgan("| :date[iso] | :method | :url | :status | :response-time ms |"));
        if (env.isProd) this.app.use(morgan("tiny"));

        this.app.use(json());
        this.app.use(urlencoded({ extended: false }));
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
        this.server.listen(env.PORT, () => {
            console.log(`App listening on the port ${env.PORT}`);
        });
    }

    public initSocketIO() {
        const io = new Socket(this.server, { cors: corsOptions });
        this.app.io = io;

        let onlineUsers: { user_id: string; socket_id: string }[] = [];

        io.on("connection", socket => {
            socket.on("disconnecting", () => {
                const disconnectedId = socket.id;
                // console.log(
                //     disconnectedId,
                //     onlineUsers.find(u => u.socket_id == disconnectedId),
                // );
                onlineUsers = onlineUsers.filter(user => user.socket_id !== disconnectedId);

                // onlineUsers.forEach(user => {
                //     socket.to(user.socket_id).emit(
                //         "other-users",
                //         onlineUsers.map(user => user.user_id),
                //     );
                // });
            });
            socket.on("user-online", (userId: string) => {
                // socket.emit(
                //     "other-users",
                //     onlineUsers.map(user => user.user_id),
                // );

                if (!onlineUsers.some(u => u.user_id == userId)) {
                    onlineUsers.push({ user_id: userId, socket_id: socket.id });
                }
                // console.log(onlineUsers);
                // socket.broadcast.emit("new-user", userId);
            });

            socket.on("send-msg-cnt", (data: { to: string; message: MessageContent }) => {
                // console.log("send-msg-cnt to: ", { to: data.to });
                const sendUserSocket = onlineUsers.find(user => user.user_id === data.to);
                if (sendUserSocket) {
                    socket.to(sendUserSocket.socket_id).emit("recieve-msg-cnt", data.message);
                    socket.to(sendUserSocket.socket_id).emit("msg-sent");
                }
            });

            socket.on("send-new-msg", (data: { to: string; message: Message }) => {
                // console.log("send-new-msg to: ", { to: data.to });
                const sendUserSocket = onlineUsers.find(user => user.user_id === data.to);
                if (sendUserSocket) {
                    socket.to(sendUserSocket.socket_id).emit("recieve-new-msg", data.message);
                }
            });
        });
    }
}
