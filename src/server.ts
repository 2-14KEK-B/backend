/// <reference path="./types/session.d.ts" />
/// <reference path="./types/request.d.ts" />
import App from "./app";
import debug from "debug";
import AuthenticationController from "@authentication/index";
import UserController from "@controllers/user";
import BookController from "@controllers/book";
import BorrowController from "@controllers/borrow";
import MessageController from "@controllers/message";
import connectToDatabase from "@utils/connectToDatabase";

debug("express");

const mongoClient = connectToDatabase().getClient();

const app = new App(
    [new AuthenticationController(), new BookController(), new BorrowController(), new MessageController(), new UserController()],
    mongoClient,
);

app.listen();
