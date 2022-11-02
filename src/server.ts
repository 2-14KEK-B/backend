import { config } from "dotenv";
import App from "./app";
import AuthenticationController from "@authentication/index";
import UserController from "@controllers/user";
import BookController from "@controllers/book";
import BorrowController from "@controllers/borrow";
import MessageController from "@controllers/message";
import validateEnv from "@utils/validateEnv";

config();
validateEnv(process.env.NODE_ENV === "development" ? "dev" : "prod");

const app = new App([new AuthenticationController(), new BookController(), new BorrowController(), new MessageController(), new UserController()]);

app.listen();
