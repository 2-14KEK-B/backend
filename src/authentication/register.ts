import { hash } from "bcrypt";
import { type JwtPayload, sign, verify } from "jsonwebtoken";
import env from "@config/validateEnv";
import { userModel } from "@models";
import { validationMiddleware as validation } from "@middlewares";
import { sendEmail, StatusCode } from "@utils";
import { RegisterDto } from "@validators";
import { HttpError, UserAlreadyExistsException } from "@exceptions";
import type { NextFunction, Request, Response, Router } from "express";
import type { Controller, RegisterCred } from "@interfaces";

export default class RegisterController implements Controller {
    path: string;
    router: Router;
    private user = userModel;

    constructor(path: string, router: Router) {
        this.path = path;
        this.router = router;
        this.initializeRoute();
    }

    private initializeRoute() {
        this.router.post(`${this.path}/register`, validation(RegisterDto), this.register);
        this.router.get(`${this.path}/verify-email`, this.emailVerification);
    }

    private register = async (req: Request<unknown, unknown, RegisterCred>, res: Response, next: NextFunction) => {
        try {
            const { email, username, password } = req.body;

            if (await this.user.exists({ $or: [{ email }, { username }] }))
                return next(new UserAlreadyExistsException());

            if (password.length < 8) {
                return next(new HttpError("validation.user.passwordMinLength"));
            } else if (password.length > 64) {
                return next(new HttpError("validation.user.passwordMaxLength"));
            }

            const hashedPassword = await hash(password, 10);
            if (!hashedPassword) return next(new HttpError("error.defaultPassword"));

            // { expiresIn: "1d" }
            const token = sign({ email }, env.SECRET);

            const emailBody = {
                subject: res.__("email.verifySubject"),
                html: res.__("email.passwordBody", { link: `${env.FRONT_URL}/verify?token=${token}` }),
            };

            if (env.isProd) await sendEmail(email, emailBody.subject, emailBody.html, next);

            const newUser = await this.user.create({
                ...req.body,
                password: hashedPassword,
                verification_token: token,
            });
            if (!newUser) return next(new HttpError("error.failedUserCreation"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };

    /* istanbul ignore next */
    private emailVerification = async (
        req: Request<undefined, undefined, undefined, { token: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const token = req.query["token"];

            const { email } = verify(token, env.SECRET) as JwtPayload;
            if (!email) {
                return next(new HttpError("error.tokenNotValidOrExpired"));
            }

            const user = await this.user.findOne({ email }).exec();
            if (user == null) {
                return next(new HttpError("error.emailFailedVerify"));
            }
            if (user.email_is_verified) {
                return next(new HttpError("error.emailAlreadyVerified"));
            }

            user.email_is_verified = true;
            user.verification_token = undefined;

            await user.save();

            res.json(res.__("success.emailVerification"));
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
