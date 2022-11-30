import App from "./app";
import debug from "debug";
import AuthenticationController from "@authentication/index";
import UserController from "@controllers/user";
import BookController from "@controllers/book";
import BorrowController from "@controllers/borrow";
import MessageController from "@controllers/message";
import connectToDatabase from "@db/connectToDatabase";
import type { Server } from "socket.io";

debug("express");
let io: Server;

(async () => {
    await connectToDatabase();
    const app = new App([
        new AuthenticationController(),
        new BookController(),
        new BorrowController(),
        new MessageController(),
        new UserController(),
    ]);
    io = app.initSocketIO();
    app.listen();
})();

export { io };
