import { config } from "dotenv";
import App from "./app";
import AuthenticationController from "@auth/index";
import UserController from "@controllers/user";
import validateEnv from "@utils/validateEnv";

config();
validateEnv(process.env.NODE_ENV === "development" ? "dev" : "prod");

const app = new App([new AuthenticationController(), new UserController()]);

app.listen();
