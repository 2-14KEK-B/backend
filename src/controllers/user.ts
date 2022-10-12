import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import authMiddleware from "@middlewares/auth";
import validationMiddleware from "@middlewares/validation";
import { userModel } from "@models/user";
import { postModel } from "@models/post";
import CreateUserDto from "@validators/user";
import { Controller } from "@interfaces/controller";
import { RequestWithUser } from "@interfaces/request_user";
import { User } from "@interfaces/user";
import UserNotFoundException from "../exceptions/UserNotFoundException";
import IdNotValidException from "../exceptions/IdNotValidException";
import HttpException from "../exceptions/HttpException";

export default class UserController implements Controller {
    public path = "/users";
    public router = Router();
    private user = userModel;
    private post = postModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/posts/:id`, authMiddleware, this.getAllPostsOfUserByID);
        this.router.get(`${this.path}/posts/`, authMiddleware, this.getAllPostsOfLoggedUser);
        this.router.get(`${this.path}/:id`, authMiddleware, this.getUserById);
        this.router.get(this.path, authMiddleware, this.getAllUsers);

        this.router.patch(
            `${this.path}/:id`,
            [authMiddleware, validationMiddleware(CreateUserDto, true)],
            this.modifyUser,
        );

        this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteUser);
    }

    private getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            this.user.find().then(users => {
                res.send(users);
            });
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private getUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (Types.ObjectId.isValid(id)) {
                // const userQuery = this.user.findById(id);
                // if (request.query.withPosts === "true") {
                //     userQuery.populate("posts").exec();
                // }
                const user = await this.user.findById(id).populate("posts");
                if (user) {
                    res.send(user);
                } else {
                    next(new UserNotFoundException(id));
                }
            } else {
                next(new IdNotValidException(id));
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private modifyUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (Types.ObjectId.isValid(id)) {
                const userData: User = req.body;
                const user = await this.user.findByIdAndUpdate(id, userData, { new: true });
                if (user) {
                    res.send(user);
                } else {
                    next(new UserNotFoundException(id));
                }
            } else {
                next(new IdNotValidException(id));
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (Types.ObjectId.isValid(id)) {
                const successResponse = await this.user.findByIdAndDelete(id);
                if (successResponse) {
                    res.sendStatus(200);
                } else {
                    next(new UserNotFoundException(id));
                }
            } else {
                next(new IdNotValidException(id));
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private getAllPostsOfLoggedUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        try {
            const id = req.user._id; // Stored user's ID in Cookie
            const posts = await this.post.find({ author: id });
            res.send(posts);
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private getAllPostsOfUserByID = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (Types.ObjectId.isValid(req.params.id)) {
                const id: string = req.params.id;
                const posts = await this.post.find({ author: id });
                res.send(posts);
            } else {
                next(new IdNotValidException(req.params.id));
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };
}
