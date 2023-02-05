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
        this.router.post(`${this.path}/facebook`, this.loginAndRegisterWithFacebook);
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
                return next(new HttpError("error.emailSentNotVerified"));
            }

            const isPasswordMatching = await compare(password, existingUser.password);
            if (!isPasswordMatching) return next(new WrongCredentialsException());

            const user = await this.user //
                .getInitialData(existingUser._id.toString());

            delete user["password"];

            req.session["userId"] = user._id.toString();
            req.session["role"] = user.role;

            res.json(user);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
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
            if (!data) return next(new HttpError("error.failedGoogle"));

            const userId = await this.user //
                .exists({ email: data.email })
                .exec();

            if (userId) {
                const user = await this.user //
                    .getInitialData(userId as unknown as string);

                req.session["userId"] = user._id;
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
                if (!newUser) return next(new HttpError("error.user.failedCreateUser"));

                req.session["userId"] = newUser._id;
                req.session["role"] = newUser.role;
                return res.json(newUser);
            }
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    /* istanbul ignore next */
    private loginAndRegisterWithFacebook = async (
        req: Request<unknown, unknown, { userID: string; token: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userID, token } = req.body;

            const resp = await fetch(
                `https://graph.facebook.com/${userID}?fields=email,name,picture&access_token=${token}`,
                { method: "GET" },
            );
            if (!resp.ok) {
                return next(new HttpError("error.failedFacebook"));
            }
            const data: {
                email: string;
                name: string;
                picture: {
                    data: {
                        height: number;
                        is_silhouette: boolean;
                        url: string;
                        width: number;
                    };
                };
                id: string;
            } = await resp.json();

            const userId = await this.user //
                .exists({ email: data.email })
                .exec();

            if (userId) {
                const user = await this.user //
                    .getInitialData(userId as unknown as string);

                req.session["userId"] = user._id;
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
                        picture: data.picture.data.url,
                        email: data.email,
                        email_is_verified: true,
                        username,
                        fullname: data.name,
                        password: "stored at Facebook",
                    });
                if (!newUser) return next(new HttpError("error.user.failedCreateUser"));

                req.session["userId"] = newUser._id;
                req.session["role"] = newUser.role;
                return res.json(newUser);
            }
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
