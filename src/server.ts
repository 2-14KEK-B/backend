/// <reference path="./types/session.d.ts" />
/// <reference path="./types/request.d.ts" />
import App from "./app";
import AuthenticationController from "@authentication/index";
import UserController from "@controllers/user";
import BookController from "@controllers/book";
import BorrowController from "@controllers/borrow";
import MessageController from "@controllers/message";

const app = new App([new AuthenticationController(), new BookController(), new BorrowController(), new MessageController(), new UserController()]);

app.listen();
