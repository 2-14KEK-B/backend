import { config } from "dotenv";
import App from "./app";
import AuthenticationController from "@auth/authentication";
import PostController from "@controllers/post";
import UserController from "@controllers/user";
import { validateEnv } from "@utils/validateEnv";

config();
if (process.env.NODE_ENV === "development") {
    validateEnv(true);
} else {
    validateEnv();
}

const app = new App([new PostController(), new AuthenticationController(), new UserController()]);

app.listen();
