import App from "./app";
import debug from "debug";
import AuthenticationController from "@authentication/index";
import UserController from "@controllers/user";
import BookController from "@controllers/book";
import BorrowController from "@controllers/borrow";
import MessageController from "@controllers/message";
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
    app.listen();
})();
