import { Router } from "express";
import LoginController from "./login";
import LogoutController from "./logout";
import RegisterController from "./register";
import userModel from "@models/user";
import Controller from "@interfaces/controller";

export default class AuthenticationController implements Controller {
    path = "/auth";
    router = Router();
    private model = userModel;

    constructor() {
        this.initControllers();
    }

    private initControllers() {
        new LoginController(this.path, this.router, this.model);
        new LogoutController(this.path, this.router);
        new RegisterController(this.path, this.router, this.model);
    }
}
