import { Router, Request, Response, NextFunction } from "express";
import LoginController from "./login";
import LogoutController from "./logout";
import RegisterController from "./register";
import userModel from "@models/user";
import HttpError from "@exceptions/Http";
import UnauthorizedException from "@exceptions/Unauthorized";
import type Controller from "@interfaces/controller";
import type { User } from "@interfaces/user";

export default class AuthenticationController implements Controller {
    path = "/auth";
    router = Router();
    private user = userModel;

    constructor() {
        this.initControllers();
    }

    private initControllers() {
        this.router.get(this.path, this.checkIfLoggedIn);
        new LoginController(this.path, this.router, this.user);
        new LogoutController(this.path, this.router);
        new RegisterController(this.path, this.router, this.user);
    }

    private checkIfLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            if (!userId) return next(new UnauthorizedException());
            const user = await this.user
                .findById(userId)
                .populate(["messages", "borrows", "rated_books", "books"])
                .populate({ path: "user_ratings", populate: { path: "from_me to_me" } })
                .lean<User>()
                .exec();

            res.json(user);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
