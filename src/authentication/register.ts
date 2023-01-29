import { hash } from "bcrypt";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import userModel from "@models/user";
import env from "@config/validateEnv";
import { sendEmail } from "@utils/sendEmail";
import { dictionaries } from "@utils/dictionaries";
import validationMiddleware from "@middlewares/validation";
import RegisterDto from "@validators/register";
import HttpError from "@exceptions/Http";
import UserAlreadyExistsException from "@exceptions/UserAlreadyExists";
import type { NextFunction, Request, Response, Router } from "express";
import type Controller from "@interfaces/controller";
import type { RegisterCred } from "@interfaces/authentication";
import StatusCode from "@utils/statusCodes";

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
            const { email, username, password } = req.body;

            if (await this.user.exists({ $or: [{ email }, { username }] }))
                return next(new UserAlreadyExistsException());

            const hashedPassword = await hash(password, 10);
            if (!hashedPassword) return next(new HttpError("defaultPassword"));

            // , { expiresIn: "1d" }
            const token = sign({ email }, env.SECRET);

            // const dictionary = dictionaries[req.headers["accept-language"]];
            const dictionary = dictionaries[global.language];
            const body = dictionary.email.passwordBody;

            const emailBody = {
                subject: dictionary.email.verifySubject,
                html: body.replace("#link#", `${env.FRONT_URL}/verify?token=${token}`),
            };

            if (!env.isTest) await sendEmail(email, emailBody.subject, emailBody.html, next);

            const newUser = await this.user.create({
                ...req.body,
                password: hashedPassword,
                verification_token: token,
            });
            if (!newUser) return next(new HttpError("failedUserCreation"));

            res.sendStatus(StatusCode.NoContent);
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
                return next(new HttpError("tokenNotValidOrExpired"));
            }

            const user = await this.user.findOne({ email }).exec();
            if (user == null) {
                return next(new HttpError("emailFailedVerify"));
            }
            if (user.email_is_verified) {
                return next(new HttpError("emailAlreadyVerified"));
            }

            // const dictionary = dictionaries[req.headers["accept-language"]];
            const dictionary = dictionaries[global.language];

            user.email_is_verified = true;
            user.verification_token = undefined;

            await user.save();

            res.json(dictionary.success.emailVerification);
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
