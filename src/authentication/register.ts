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

            const token = sign({ email }, env.SECRET, { expiresIn: "1d" });

            const emailBody = {
                subject: "Email Verification",
                html: `<div>Hi,</div><br /><div>We just need to verify your email address before you can access ${env.FRONT_URL}.</div><br /><div>Verify your email address ${env.FRONT_URL}/verify/${token}.</div><br /><div>Thanks! The BookSwap team</div>
                `,
            };

            await sendEmail(email, emailBody.subject, emailBody.html, next);

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

            const { modifiedCount } = await this.user.updateOne({ email }, { emailVerified: true }).exec();
            if (modifiedCount != 1) {
                return next(new HttpError("Failed to verify the email"));
            }

            res.send("Email verified successfully");
        } catch (error) {
            res.status(401).send("Invalid token");
        }
    };
}
