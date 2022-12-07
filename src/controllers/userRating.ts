import userRatingModel from "@models/userRating";
import { Router, Request, Response, NextFunction } from "express";
// import { Types } from "mongoose";
import validationMiddleware from "@middlewares/validation";
import authenticationMiddleware from "@middlewares/authentication";
// import authorizationMiddleware from "@middlewares/authorization";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import isIdNotValid from "@utils/idChecker";
// import StatusCode from "@utils/statusCodes";
// import { BookRatingDto } from "@validators/book";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { CreateUserRating, UserRating } from "@interfaces/userRating";
import { UserRatingDto } from "@validators/userRating";

export default class UserRatingController implements Controller {
    path = "/";
    router = Router();
    borrow = borrowModel;
    user = userModel;
    userRating = userRatingModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.all("*", authenticationMiddleware);
        this.router.get(this.path, this.getAllUserRating);
        this.router.get(`${this.path}:id`, this.getUserRatingById);
        this.router.post(this.path, validationMiddleware(UserRatingDto), this.createUserRatingByBorrowId);
        // this.router.delete(`${this.path}/:userId`, [authenticationMiddleware, authorizationMiddleware(["admin"])], this.deleteBookRatingByBookId);
    }

    private getAllUserRating = async (
        req: Request<unknown, unknown, unknown, { user?: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.session.userId as string;

            const { user_ratings } = await this.user
                .findById(userId, { user_ratings: 1, _id: 0 })
                .populate({ path: "user_ratings", populate: { path: "from_me to_me" } })
                .lean<{ user_ratings: UserRating[] }>()
                .exec();

            // const userRatings = await this.borrow
            //     .findById(userId, { user_ratings: 1 })
            //     .populate("user_ratings")
            //     .lean<{ user_ratings: UserRating[] }>()
            //     .exec();
            // console.log(userRatings);
            if (!user_ratings) return next(new HttpError("Failed to get user ratings of the borrow"));

            res.json(user_ratings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserRatingById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params["id"] as string;

            const rating = await this.userRating
                .findById(id)
                .lean<UserRating>()
                .exec();
            console.log(rating);0
            if (!rating) return next(new HttpError("Failed to get user ratings of the borrow"));

            res.json(rating);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createUserRatingByBorrowId = async (
        req: Request<unknown, unknown, CreateUserRating, { user: string; borrow: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            // const myId = req.session.userId as string;
            const borrowId = req.query.borrow;
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            const userId = req.query.user;
            if (await isIdNotValid(this.user, [userId], next)) return;

            // const book = await this.borrow.findOne({ _id: borrowId, "ratings.from_id": userId }).lean<Book>().exec();
            // if (book) return next(new HttpError("Already rated this book."));

            const rateData: CreateUserRating = req.body;
            // const ratedBook = await this.borrow
            //     .findByIdAndUpdate(borrowId, { $push: { ratings: { ...rateData, from_id: userId } } }, { returnDocument: "after" })
            //     .lean<Book>()
            //     .exec();
            // if (!ratedBook) return next(new HttpError("Failed to rate book"));

            // const updatedUser = await this.user.findByIdAndUpdate(userId, { $push: { rated_books: ratedBook?._id } }, { returnDocument: "after" });
            // if (!updatedUser) return next(new HttpError("Failed to update the user"));

            // res.json(ratedBook);

            res.json({
                borrow: await this.borrow.findById(borrowId),
                user: await this.user.findById(userId),
                data: rateData,
            });
            // res.sendStatus(200);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    // private deleteBookRatingByBookId = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const userId = req.session.userId as string;
    //         const bookId = req.params["id"];
    //         if (await isIdNotValid(this.borrow, [bookId], next)) return;

    //         const book = await this.borrow.findOne({ _id: bookId, "ratings.from_id": userId }).lean<Book>().exec();
    //         if (!book) return next(new HttpError("You did not rate this book."));

    //         const { acknowledged } = await this.borrow.updateOne({ _id: bookId }, { $pull: { ratings: { from_id: new Types.ObjectId(userId) } } });

    //         if (!acknowledged) return next(new HttpError("Failed to delete book"));

    //         const updatedUser = await this.user.findByIdAndUpdate(userId, { $pull: { rated_books: book?._id } }, { returnDocument: "after" });
    //         if (!updatedUser) return next(new HttpError("Failed to update the user"));

    //         res.sendStatus(StatusCode.NoContent);
    //     } catch (error) {
    //         next(new HttpError(error));
    //     }
    // };
}
