// import { Router } from "express";
import { Router, Request, Response } from "express";
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
        this.router.get(this.path, this.checkIfLoggedIn);
        new LoginController(this.path, this.router, this.model);
        new LogoutController(this.path, this.router);
        new RegisterController(this.path, this.router, this.model);
    }

    private checkIfLoggedIn = async (req: Request, res: Response) => {
        console.log("test session: ", req.session);
        if (!req.session.userId) return res.sendStatus(401);
        const user = await userModel.findById(req.session.userId, "-password -books -borrows -messages -user_ratings");
        res.send(user);
    };
}
