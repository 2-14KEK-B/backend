import App from "./app";
import debug from "debug";
import { AuthenticationController } from "@authentication";
import { UserController, BookController, BorrowController, MessageController } from "@controllers";
import connectToDatabase from "@db/connectToDatabase";

debug("express");

(async () => {
    await connectToDatabase();
    const app = new App([
        new AuthenticationController(),
        new BookController(),
        new BorrowController(),
        new MessageController(),
        new UserController(),
    ]);
    app.initSocketIO();
    app.listen();
})();
