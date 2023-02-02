import { Router, Request, Response, NextFunction } from "express";
import LoginController from "./login";
import LogoutController from "./logout";
import RegisterController from "./register";
import userModel from "@models/user";
import env from "@config/validateEnv";
import HttpError from "@exceptions/Http";
import UnauthorizedException from "@exceptions/Unauthorized";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { sendEmail } from "@utils/sendEmail";
import { compare, hash } from "bcrypt";
import WrongCredentialsException from "@exceptions/WrongCredentials";
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
        this.router.post(`${this.path}/forgot-password`, this.sendForgotPasswordEmail);
        this.router.post(`${this.path}/reset-password`, this.saveNewPassword);
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
            next(error);
        }
    };

    /* istanbul ignore next */
    private sendForgotPasswordEmail = async (req: Request<{ email: string }>, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;

            const user = await this.user.findOne({ email: email, email_is_verified: true }).exec();
            if (user == null) {
                return next(new HttpError("error.emailNotFoundOrVerified"));
            }

            if (user.password_reset_token) {
                return next(new HttpError("error.emailAlreadySent"));
            }

            //, { expiresIn: "6h" }
            const token = sign({ email }, env.SECRET);

            const emailBody = {
                subject: res.__("email.passwordSubject"),
                html: res.__("email.passwordBody", { link: `${env.FRONT_URL}/reset-password?token=${token}` }),
            };

            if (env.isProd) await sendEmail(email, emailBody.subject, emailBody.html, next);

            user.password_reset_token = token;
            await user.save();

            res.json(res.__("success.passwordResetEmail"));
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
    /* istanbul ignore next */
    private saveNewPassword = async (
        req: Request<undefined, undefined, { token: string; oldPassword: string; newPassword: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { token, oldPassword, newPassword } = req.body;
            const { email } = verify(token, env.SECRET) as JwtPayload;
            if (!email) {
                return next(new HttpError("error.tokenNotValidOrExpired"));
            }

            const user = await this.user
                .findOne({ email: email, email_is_verified: true }, { password: 1, password_reset_token: 1 })
                .exec();
            if (user == null) {
                return next(new HttpError("error.emailNotFoundOrVerified"));
            }

            if (!user.password_reset_token) {
                return next(new HttpError("error.tokenAlreadyUsed"));
            }

            if (user.password != "stored at Google") {
                const isPasswordMatching = await compare(oldPassword, user.password as string);
                if (!isPasswordMatching) return next(new WrongCredentialsException());
            }

            if (newPassword.length < 8) {
                return next(new HttpError("validation.user.passwordMinLength"));
            } else if (newPassword.length > 64) {
                return next(new HttpError("validation.user.passwordMaxLength"));
            }

            const hashedPassword = await hash(newPassword, 10);
            if (!hashedPassword) return next(new HttpError("error.defaultPassword"));

            user.password = hashedPassword;
            user.password_reset_token = undefined;
            await user.save();

            res.json(res.__("success.passwordReset"));
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
