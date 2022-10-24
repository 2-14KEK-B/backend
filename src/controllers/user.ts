import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import validationMiddleware from "@middlewares/validation";
import userModel from "@models/user";
import CreateUserDto from "@validators/user";
import Controller from "@interfaces/controller";
import User from "@interfaces/user";
import UserNotFoundException from "@exceptions/UserNotFound";
import IdNotValidException from "@exceptions/IdNotValid";
import HttpError from "@exceptions/Http";

export default class UserController implements Controller {
    path = "/users";
    router = Router();
    private user = userModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.getAllUsers);
        this.router.get(`${this.path}/:id`, this.getUserById);
        this.router.patch(`${this.path}/:id`, [validationMiddleware(CreateUserDto, true)], this.modifyUser);
        this.router.delete(`${this.path}/:id`, this.deleteUser);
    }

    private getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await this.user.find();
            res.send(users);
        } catch (error) {
            next(new HttpError(400, error.message));
        }
    };

    private getUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (!Types.ObjectId.isValid(id)) return next(new IdNotValidException(id));

            const user = await this.user.findById(id);
            if (!user) return next(new UserNotFoundException(id));

            res.send(user);
        } catch (error) {
            next(new HttpError(400, error.message));
        }
    };

    private modifyUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (!Types.ObjectId.isValid(id)) return next(new IdNotValidException(id));

            const userData: User = req.body;
            const user = await this.user.findByIdAndUpdate(id, userData, { new: true });
            if (!user) return next(new UserNotFoundException(id));

            res.send(user);
        } catch (error) {
            next(new HttpError(400, error.message));
        }
    };

    private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (!Types.ObjectId.isValid(id)) return next(new IdNotValidException(id));

            const successResponse = await this.user.findByIdAndDelete(id);
            if (!successResponse) return next(new UserNotFoundException(id));

            res.sendStatus(200);
        } catch (error) {
            next(new HttpError(400, error.message));
        }
    };
}
