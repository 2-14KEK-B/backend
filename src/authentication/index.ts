import { Router, Request, Response, NextFunction } from "express";
import LoginController from "./login";
import LogoutController from "./logout";
import RegisterController from "./register";
import userModel from "@models/user";
import HttpError from "@exceptions/Http";
import UnauthorizedException from "@exceptions/Unauthorized";
import type Controller from "@interfaces/controller";

export default class AuthenticationController implements Controller {
    path = "/auth";
    router = Router();
    private user = userModel;

    constructor() {
        this.initControllers();
    }

    private initControllers() {
        this.router.get(this.path, this.checkIfLoggedIn);
        new LoginController(this.path, this.router);
        new LogoutController(this.path, this.router);
        new RegisterController(this.path, this.router);
    }

    private checkIfLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            if (!userId) return next(new UnauthorizedException());
            const user = await this.user.getInitialData(userId);

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
