import { Router, Request, Response, NextFunction } from "express";
import LoginController from "./login";
import LogoutController from "./logout";
import RegisterController from "./register";
import userModel from "@models/user";
import HttpError from "@exceptions/Http";
import UnauthorizedException from "@exceptions/Unauthorized";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { sendEmail } from "@utils/sendEmail";
import env from "@config/validateEnv";
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
            next(new HttpError(error.message));
        }
    };

    /* istanbul ignore next */
    private sendForgotPasswordEmail = async (req: Request<{ email: string }>, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;

            const user = await this.user.findOne({ email: email, email_is_verified: true }).exec();
            if (user == null) {
                return next(new HttpError("Email not found or not verified"));
            }

            if (user.password_reset_token) {
                return next(new HttpError("Email already sent"));
            }

            const token = sign({ email }, env.SECRET, { expiresIn: "6h" });

            const emailBody = {
                subject: "Password reset",
                html: `<div>Hi,</div><br /><div>Password reset link: ${env.FRONT_URL}/reset-password?token=${token}.</div><br /><div>Thanks! The BookSwap team</div>
                `,
            };

            if (!env.isTest) await sendEmail(email, emailBody.subject, emailBody.html, next);

            user.password_reset_token = token;
            await user.save();

            res.json("Password reset email sent");
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
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
            if (newPassword.length < 6) {
                return next(new HttpError("You need to send stronger password"));
            }
            const { email } = verify(token, env.SECRET) as JwtPayload;

            const user = await this.user
                .findOne({ email: email, email_is_verified: true }, { password: 1, password_reset_token: 1 })
                .exec();
            if (user == null) {
                return next(new HttpError("Email is not valid or not verified"));
            }

            if (!user.password_reset_token) {
                return next(new HttpError("Token already has been used"));
            }

            const isPasswordMatching = await compare(oldPassword, user.password as string);
            if (!isPasswordMatching) return next(new WrongCredentialsException());

            const hashedPassword = await hash(newPassword, 10);
            if (!hashedPassword) return next(new HttpError("Something wrong with the password."));

            user.password = hashedPassword;
            user.password_reset_token = undefined;
            await user.save();

            res.json("Password reset successfully");
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
