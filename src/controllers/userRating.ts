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
    router = Router({ mergeParams: true });
    borrow = borrowModel;
    user = userModel;

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.all("*", authenticationMiddleware);
        this.router.get(this.path, this.getAllUserRatingByBorrowId);
        this.router.post(`${this.path}:userId`, validationMiddleware(UserRatingDto), this.createUserRatingByBorrowId);
        // this.router.delete(`${this.path}/:userId`, [authenticationMiddleware, authorizationMiddleware(["admin"])], this.deleteBookRatingByBookId);
    }

    private getAllUserRatingByBorrowId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const borrowId = req.params["id"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;

            const userRatings = await this.borrow
                .findById(borrowId, { user_ratings: 1 })
                .populate("user_ratings")
                .lean<{ user_ratings: UserRating[] }>()
                .exec();
            console.log(userRatings);
            if (!userRatings) return next(new HttpError("Failed to get user ratings of the borrow"));

            res.json(userRatings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createUserRatingByBorrowId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // const myId = req.session.userId as string;
            const borrowId = req.params["id"];
            const userId = req.params["userId"];
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;

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

            res.json({ borrow: await borrowModel.findById(borrowId), user: await userModel.findById(userId), data: rateData });
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
