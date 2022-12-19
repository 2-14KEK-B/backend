import { compare } from "bcrypt";
import validationMiddleware from "@middlewares/validation";
import LoginDto from "@validators/login";
import HttpError from "@exceptions/Http";
import WrongCredentialsException from "@exceptions/WrongCredentials";
import { OAuth2Client } from "google-auth-library";
import type { FilterQuery, Types } from "mongoose";
import type { NextFunction, Request, Response, Router } from "express";
import type { LoginCred } from "@interfaces/authentication";
import type { User } from "@interfaces/user";
import type Controller from "@interfaces/controller";
import userModel from "@models/user";

export default class LoginController implements Controller {
    path: string;
    router: Router;
    private user = userModel;

    constructor(path: string, router: Router) {
        this.path = path;
        this.router = router;
        this.initializeRoute();
    }

    private initializeRoute() {
        this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login);
        this.router.post(`${this.path}/google`, this.loginAndRegisterWithGoogle);
    }

    private login = async (req: Request<unknown, unknown, LoginCred>, res: Response, next: NextFunction) => {
        try {
            const { email, username, password } = req.body;

            let query: FilterQuery<User> = { email: email };
            if (username) {
                query = { username: username };
            }

            const existingUser = await this.user
                .findOne(query, { password: 1 })
                .lean<{ _id: Types.ObjectId; password: string }>()
                .exec();
            if (!existingUser) return next(new WrongCredentialsException());

            const isPasswordMatching = await compare(password, existingUser.password);
            if (!isPasswordMatching) return next(new WrongCredentialsException());

            const user = await this.user.getInitialData(existingUser._id.toString());

            delete user["password"];

            req.session["userId"] = user._id.toString();
            req.session["role"] = user.role;

            res.json(user);
        } catch (error) {
            next(new HttpError(error.message));
        }
    };

    /* istanbul ignore next */
    private loginAndRegisterWithGoogle = async (
        req: Request<unknown, unknown, { token: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const client: OAuth2Client = new OAuth2Client();

            client.setCredentials({ access_token: req.body.token });
            const { data } = await client.request<{
                email: string;
                email_verified: boolean;
                name: string;
                picture: string;
                locale: string;
            }>({
                url: "https://www.googleapis.com/oauth2/v3/userinfo",
            });

            if (!data) return next(new HttpError("Failed to receive data from google"));

            const userId = await this.user.exists({ email: data.email }).exec();

            if (userId) {
                const user = await this.user.getInitialData(userId as unknown as string);
                req.session["userId"] = user._id;
                req.session["role"] = user.role;
                return res.send(user);
            } else {
                const newUser = await this.user.create({
                    ...data,
                    email_is_verified: data.email_verified,
                    fullname: data.name,
                    password: "stored at Google",
                });

                if (!newUser) return next(new HttpError("Failed to create user"));

                req.session["userId"] = newUser._id;
                req.session["role"] = newUser.role;
                return res.send(newUser);
            }
        } catch (error) {
            next(new HttpError(error.message));
        }
    };
}
