import { hash } from "bcrypt";
import validationMiddleware from "@middlewares/validation";
import RegisterDto from "@validators/register";
import HttpError from "@exceptions/Http";
import UserAlreadyExistsException from "@exceptions/UserAlreadyExists";
import type { NextFunction, Request, Response, Router } from "express";
import type { Model } from "mongoose";
import type Controller from "@interfaces/controller";
import type { User } from "@interfaces/user";
import type { RegisterCred } from "@interfaces/authentication";

export default class RegisterController implements Controller {
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
        this.router.post(`${this.path}/register`, validationMiddleware(RegisterDto), this.register);
    }

    private register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userData: RegisterCred = req.body;
            if (await this.userModel.exists({ email: userData.email })) return next(new UserAlreadyExistsException(userData.email));

            const hashedPassword = await hash(userData.password, 10);
            if (!hashedPassword) return next(new HttpError("Something wrong with the password."));

            const { email } = await this.userModel.create({
                ...userData,
                password: hashedPassword,
            });
            if (!email) return next(new HttpError("Something wrong with the user creation."));

            res.json(`user created with ${email}`);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
