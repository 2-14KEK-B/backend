import { hash } from "bcrypt";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import userModel from "@models/user";
import env from "@config/validateEnv";
import { sendEmail } from "@utils/sendEmail";
import validationMiddleware from "@middlewares/validation";
import RegisterDto from "@validators/register";
import HttpError from "@exceptions/Http";
import UserAlreadyExistsException from "@exceptions/UserAlreadyExists";
import type { NextFunction, Request, Response, Router } from "express";
import type Controller from "@interfaces/controller";
import type { RegisterCred } from "@interfaces/authentication";

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
        this.router.post(`${this.path}/register`, validationMiddleware(RegisterDto), this.register);
        this.router.get(`${this.path}/verify-email`, this.emailVerification);
    }

    private register = async (req: Request<unknown, unknown, RegisterCred>, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (await this.user.exists({ email: email })) return next(new UserAlreadyExistsException(req.body.email));

            const hashedPassword = await hash(password, 10);
            if (!hashedPassword) return next(new HttpError("Something wrong with the password."));

            // , { expiresIn: "1d" }
            const token = sign({ email }, env.SECRET);

            const emailBody = {
                subject: "Email Verification",
                html: `<div>Hi,</div><br /><div>We just need to verify your email address before you can access ${env.FRONT_URL}.</div><br /><div>Verify your email address ${env.FRONT_URL}/verify?token=${token}.</div><br /><div>Thanks! The BookSwap team</div>
                `,
            };

            if (!env.isTest) await sendEmail(email, emailBody.subject, emailBody.html, next);

            const newUser = await this.user.create({
                ...req.body,
                password: hashedPassword,
                verification_token: token,
            });
            if (!newUser) return next(new HttpError("Something wrong with the user creation."));

            res.json(`user created: ${newUser.email}`);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
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
                return next(new HttpError("Token is not valid or expired"));
            }

            const user = await this.user.findOne({ email }).exec();
            if (user == null) {
                return next(new HttpError("Failed to verify the email"));
            }
            if (user.email_is_verified) {
                return next(new HttpError("Email already verified. Just log in."));
            }

            user.email_is_verified = true;
            user.verification_token = undefined;

            await user.save();

            res.json("Email verified successfully");
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
