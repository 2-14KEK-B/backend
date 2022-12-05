import { compare } from "bcrypt";
import validationMiddleware from "@middlewares/validation";
import LoginDto from "@validators/login";
import HttpError from "@exceptions/Http";
import WrongCredentialsException from "@exceptions/WrongCredentials";
import type { Model } from "mongoose";
import type { NextFunction, Request, Response, Router } from "express";
import type { LoginCred } from "@interfaces/authentication";
import type { User } from "@interfaces/user";
import type Controller from "@interfaces/controller";

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

    private login = async (req: Request<unknown, unknown, LoginCred>, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            const user = await this.userModel //
                .findOne({ email: email })
                .lean<User>()
                .exec();
            if (!user) return next(new WrongCredentialsException());

            const isPasswordMatching = await compare(password, user.password as string);
            if (!isPasswordMatching) return next(new WrongCredentialsException());

            delete user["password"];

            req.session.userId = user._id.toString();
            res.json(user);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
