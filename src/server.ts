import App from "./app";
import debug from "debug";
import AuthenticationController from "@authentication/index";
import UserController from "@controllers/user";
import BookController from "@controllers/book";
import BorrowController from "@controllers/borrow";
import MessageController from "@controllers/message";
import connectToDatabase from "src/db/connectToDatabase";
import { createSessionStore } from "src/db/sessionStore";

debug("express");

connectToDatabase().then(() => {
    createSessionStore();
});

const app = new App([new AuthenticationController(), new BookController(), new BorrowController(), new MessageController(), new UserController()]);

app.listen();
