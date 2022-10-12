import bcrypt from "bcrypt";
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserWithThatEmailAlreadyExistsException from "@exceptions/UserWithThatEmailAlreadyExistsException";
import WrongCredentialsException from "@exceptions/WrongCredentialsException";
import HttpException from "@exceptions/HttpException";
import { Controller } from "@interfaces/controller";
import { DataStoredInToken } from "@interfaces/token/dataStoredInToken";
import { TokenData } from "@interfaces/token/tokenData.interface";
import validationMiddleware from "@middlewares/validation";
import { User } from "@interfaces/user";
import { userModel } from "@models/user";
import CreateUserDto from "@validators/user";
import LogInDto from "@validators/logIn";

export default class AuthenticationController implements Controller {
    public path = "/auth";
    public router = Router();
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/isAuth`, async (req: Request, res: Response) => res.send(req.cookies));
        this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), this.registration);
        this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn);
        this.router.post(`${this.path}/logout`, this.loggingOut);
    }

    private registration = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userData: User = req.body;
            if (await this.user.findOne({ email: userData.email })) {
                next(new UserWithThatEmailAlreadyExistsException(userData.email));
            } else {
                const hashedPassword = await bcrypt.hash(userData.password, 10);

                const user = await this.user.create({
                    ...userData,
                    password: hashedPassword,
                });
                user.password = undefined;
                const tokenData: TokenData = this.createToken(user);
                res.setHeader("Set-Cookie", [this.createCookie(tokenData)]);
                res.send(user);
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private loggingIn = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const logInData: User = req.body;
            const user = await this.user.findOne({ email: logInData.email });
            if (user) {
                const isPasswordMatching = await bcrypt.compare(logInData.password, user.password);
                if (isPasswordMatching) {
                    user.password = undefined;
                    const tokenData = this.createToken(user);
                    res.setHeader("Set-Cookie", [this.createCookie(tokenData)]);
                    res.cookie("Auth", tokenData.token, { expires: tokenData.expiresIn });
                    res.send(user);
                } else {
                    next(new WrongCredentialsException());
                }
            } else {
                next(new WrongCredentialsException());
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private loggingOut = (req: Request, res: Response) => {
        res.setHeader("Set-Cookie", ["Authorization=; SameSite=None; Secure; Path=/; Max-age=0"]);
        res.sendStatus(200);
    };

    private createCookie(tokenData: TokenData) {
        return `Authorization=${tokenData.token}; SameSite=None; Secure; Path=/; Max-Age=${tokenData.expiresIn}`;
    }

    private createToken(user: User): TokenData {
        const expiresIn = 24 * 60 * 60; // 1 day
        const secret = process.env.SECRET;
        const dataStoredInToken: DataStoredInToken = {
            _id: user._id.toString(),
        };
        console.log({ expiresIn, token: jwt.sign(dataStoredInToken, secret, { expiresIn }) });
        return {
            expiresIn,
            token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
        };
    }
}
