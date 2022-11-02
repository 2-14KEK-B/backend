import { NextFunction, Request, Response, Router } from "express";
import { compare } from "bcrypt";
import { Model } from "mongoose";
import validationMiddleware from "@middlewares/validation";
import LoginDto from "@validators/login";
import Controller from "@interfaces/controller";
import { User } from "@interfaces/user";
import { LoginCred } from "@interfaces/authentication";
import HttpError from "@exceptions/Http";
import WrongCredentialsException from "@exceptions/WrongCredentials";

export default class LoginController implements Controller {
    path: string;
    router: Router;
    private userModel: Model<User>;

    constructor(path: string, router: Router, model: Model<User>) {
        this.path = path;
        this.router = router;
        this.userModel = model;
        this.initializeRoute();
    }

    private initializeRoute() {
        this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login);
    }

    private login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userData: LoginCred = req.body;

            const user = await this.userModel.findOne({ email: userData.email }).populate(["books", "borrows", "messages"]);
            if (!user) return next(new WrongCredentialsException());

            const isPasswordMatching = await compare(userData.password, user.password);
            if (!isPasswordMatching) return next(new WrongCredentialsException());

            user.password = undefined;

            req.session.userId = user._id.toString();
            req.session.save(function (err) {
                if (err) return next(err);
            });
            res.send(user);
        } catch (error) {
            next(new HttpError((error as Error).message));
        }
    };
}
