import { NextFunction, Request, Response, Router } from "express";
import { hash } from "bcrypt";
import { Model } from "mongoose";
import validationMiddleware from "@middlewares/validation";
import RegisterDto from "@validators/register";
import Controller from "@interfaces/controller";
import User from "@interfaces/user";
import { RegisterCred } from "@interfaces/auth";
import HttpError from "@exceptions/Http";
import UserAlreadyExistsException from "@exceptions/UserAlreadyExists";

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
            if (await this.userModel.findOne({ email: userData.email })) return next(new UserAlreadyExistsException(userData.email));

            const hashedPassword = await hash(userData.password, 10);
            const newUser = await this.userModel.create({
                ...userData,
                password: hashedPassword,
            });
            newUser.password = undefined;

            res.send(`user created with ${newUser.email}`);
        } catch (error) {
            next(new HttpError(400, (error as Error).message));
        }
    };
}
