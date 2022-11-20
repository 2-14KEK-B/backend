import { Router, Request, Response, NextFunction } from "express";
import LoginController from "./login";
import LogoutController from "./logout";
import RegisterController from "./register";
import userModel from "@models/user";
import UnauthorizedException from "@exceptions/Unauthorized";
import type Controller from "@interfaces/controller";
import type { User } from "@interfaces/user";

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

    private checkIfLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.session.userId) return next(new UnauthorizedException());
        const user = await userModel.findById(req.session.userId, "-password -books -borrows -messages -user_ratings").lean<User>().exec();
        res.json(user);
    };
}
