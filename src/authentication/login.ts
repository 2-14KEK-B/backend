import { OAuth2Client } from "google-auth-library";
import { compare } from "bcrypt";
import userModel from "@models/user";
import validationMiddleware from "@middlewares/validation";
import LoginDto from "@validators/login";
import HttpError from "@exceptions/Http";
import WrongCredentialsException from "@exceptions/WrongCredentials";
import type { FilterQuery, Types } from "mongoose";
import type { NextFunction, Request, Response, Router } from "express";
import type { LoginCred } from "@interfaces/authentication";
import type { User } from "@interfaces/user";
import type Controller from "@interfaces/controller";

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
                .findOne(query, { password: 1, email_is_verified: 1, verification_token: 1 })
                .lean<{
                    _id: Types.ObjectId;
                    password: string;
                    email_is_verified: boolean;
                    verification_token?: string;
                }>()
                .exec();
            if (!existingUser) return next(new WrongCredentialsException());

            if (!existingUser.email_is_verified && existingUser.verification_token) {
                return next(new HttpError("emailSentNotVerified"));
            }

            const isPasswordMatching = await compare(password, existingUser.password);
            if (!isPasswordMatching) return next(new WrongCredentialsException());

            const user = await this.user //
                .getInitialData(existingUser._id.toString());

            delete user["password"];

            req.session["userId"] = user._id.toString();
            req.session["locale"] = user.locale;
            req.session["role"] = user.role;

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
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

            client.setCredentials({ access_token: req.body["token"] });
            const { data } = await client.request<{
                email: string;
                email_verified: boolean;
                name: string;
                picture: string;
                locale: string;
            }>({
                url: "https://www.googleapis.com/oauth2/v3/userinfo",
            });

            if (!data) return next(new HttpError("failedGoogle"));

            const userId = await this.user //
                .exists({ email: data.email })
                .exec();

            if (userId) {
                const user = await this.user //
                    .getInitialData(userId as unknown as string);

                req.session["userId"] = user._id;
                req.session["locale"] = user.locale;
                req.session["role"] = user.role;
                return res.json(user);
            } else {
                const emailFirstSection = data.email.split("@")[0];
                const isUsernameOccupied = await this.user.exists({ username: emailFirstSection }).exec();

                const username = isUsernameOccupied
                    ? `${data.email.split("@")[0]}_${Math.floor(Math.random() * (100 - 1 + 1)) + 1}`
                    : emailFirstSection;

                const newUser = await this.user //
                    .create({
                        ...data,
                        email_is_verified: true,
                        username,
                        fullname: data.name,
                        password: "stored at Google",
                    });

                if (!newUser) return next(new HttpError("failedCreateUser"));

                req.session["userId"] = newUser._id;
                req.session["locale"] = newUser.locale;
                req.session["role"] = newUser.role;
                return res.json(newUser);
            }
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
