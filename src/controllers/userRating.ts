import userRatingModel from "@models/userRating";
import { Router, Request, Response, NextFunction } from "express";
import validationMiddleware from "@middlewares/validation";
import authenticationMiddleware from "@middlewares/authentication";
import authorizationMiddleware from "@middlewares/authorization";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import isIdNotValid from "@utils/idChecker";
import { UserRatingDto } from "@validators/userRating";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type Controller from "@interfaces/controller";
import type { CreateUserRating, UserRating } from "@interfaces/userRating";
import type { Types } from "mongoose";

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
        this.router.get(`${this.path}all`, authorizationMiddleware(["admin"]), this.getAllUserRatings);
        this.router.get(`${this.path}myratings`, this.getUserRatingsByLoggedInUser);
        this.router.delete(`${this.path}/:id`, this.deleteUserRatingById);
        this.router
            .route(this.path)
            .get(this.getUserRatingByUserOrBorrowId)
            .post(validationMiddleware(UserRatingDto), this.createUserRating);
    }

    private getAllUserRatings = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const userRatings = this.userRating //
                .find()
                .lean<UserRating[]>()
                .exec();
            if (!userRatings) return next(new HttpError("Failed to get all user ratings"));

            res.json(userRatings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserRatingsByLoggedInUser = async (
        req: Request<unknown, unknown, unknown, { user?: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userId = req.session["userId"];

            const userRatings = this.userRating
                .find({ $or: [{ from_id: userId }, { to_id: userId }] })
                .lean<UserRating[]>()
                .exec();

            // const { user_ratings } = await this.user
            //     .findById(userId, { user_ratings: 1 })
            //     .populate({ path: "user_ratings", populate: { path: "from_me to_me" } })
            //     .lean<{ user_ratings: UserRating[] }>()
            //     .exec();

            // const userRatings = await this.borrow
            //     .findById(userId, { user_ratings: 1 })
            //     .populate("user_ratings")
            //     .lean<{ user_ratings: UserRating[] }>()
            //     .exec();
            // console.log(userRatings);

            if (!userRatings) return next(new HttpError("Failed to get user ratings of the borrow"));

            res.json(userRatings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private getUserRatingByUserOrBorrowId = async (
        req: Request<unknown, unknown, unknown, { userId?: string; borrowId?: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userId, borrowId } = req.query;

            let ratings: UserRating[] | undefined;

            if (userId) {
                const { user_ratings } = await this.user
                    .findById(userId, { user_ratings: 1 })
                    .populate({ path: "user_ratings", populate: { path: "from_me to_me" } })
                    .lean<{ user_ratings: UserRating[] }>()
                    .exec();
                if (!user_ratings) return next(new HttpError("Failed to get user ratings of the user"));
                ratings = user_ratings;
            } else if (borrowId) {
                const { user_ratings } = await this.borrow
                    .findById(userId, { user_ratings: 1 })
                    .populate("user_ratings")
                    .lean<{ user_ratings: UserRating[] }>()
                    .exec();
                if (!user_ratings) return next(new HttpError("Failed to get user ratings of the borrow"));
                ratings = user_ratings;
            }

            if (!ratings) return next(new HttpError("You need to pass userId either borrowId"));

            // const rating = await this.userRating.findById(id).lean<UserRating>().exec();
            // console.log(rating);
            // if (!rating) return next(new HttpError("Failed to get user ratings of the borrow"));

            res.json(ratings);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private createUserRating = async (
        req: Request<unknown, unknown, CreateUserRating, { toId: string; borrowId: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const myId = req.session["userId"];
            const { toId, borrowId } = req.query;
            if (await isIdNotValid(this.borrow, [borrowId], next)) return;
            if (await isIdNotValid(this.user, [toId], next)) return;

            const { verified } = await this.borrow
                .findById(borrowId, { verified: 1 })
                .lean<{ verified: boolean }>()
                .exec();
            if (!verified) return next(new HttpError());

            const rating = await this.userRating.create({
                ...req.body,
                from_id: myId,
                to_id: toId,
                borrow_id: borrowId,
            });
            if (!rating) return next(new HttpError());

            const { acknowledged: successfullBorrowUpdate } = await this.borrow.updateOne(
                { _id: borrowId },
                { $push: { user_ratings: rating._id } },
            );
            if (!successfullBorrowUpdate) return next(new HttpError());

            const { isOk } = await this.user.bulkWrite([
                { updateOne: { filter: { _id: myId }, update: { $push: { "user_ratings.from_me": rating._id } } } },
                { updateOne: { filter: { _id: toId }, update: { $push: { "user_ratings.to_me": rating._id } } } },
            ]);
            if (!isOk) return next();

            // const { acknowledged: successfullFromUserUpdate } = await this.user.updateOne(
            //     { _id: myId },
            //     { $push: { "user_ratings.from_me": rating._id } },
            // );
            // if (!successfullFromUserUpdate) return next();

            // const { acknowledged: successfullToUserUpdate } = await this.user.updateOne(
            //     { _id: toId },
            //     { $push: { "user_ratings.to_me": rating._id } },
            // );
            // if (!successfullToUserUpdate) return next();

            // const book = await this.borrow.findOne({ _id: borrowId, "ratings.from_id": userId }).lean<Book>().exec();
            // if (book) return next(new HttpError("Already rated this book."));

            // const rateData: CreateUserRating = req.body;
            // const ratedBook = await this.borrow
            //     .findByIdAndUpdate(borrowId, { $push: { ratings: { ...rateData, from_id: userId } } }, { returnDocument: "after" })
            //     .lean<Book>()
            //     .exec();
            // if (!ratedBook) return next(new HttpError("Failed to rate book"));

            // const updatedUser = await this.user.findByIdAndUpdate(userId, { $push: { rated_books: ratedBook?._id } }, { returnDocument: "after" });
            // if (!updatedUser) return next(new HttpError("Failed to update the user"));

            // res.json(ratedBook);

            res.json(rating);
            // res.sendStatus(200);
        } catch (error) {
            next(new HttpError(error));
        }
    };

    private deleteUserRatingById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session["userId"];
            const rateId = req.params["id"];
            if (await isIdNotValid(this.userRating, [rateId], next)) return;

            const { to_id, from_id, borrow_id } = await this.userRating
                .findById(rateId, { to_id: 1, from_id: 1, borrow_id: 1 })
                .lean<{ to_id: Types.ObjectId; from_id: Types.ObjectId; borrow_id: Types.ObjectId }>()
                .exec();

            if (req.session["role"] != "admin") {
                // const { user_ratings } = await this.user
                //     .findById(userId, { user_ratings: 1 })
                //     .lean<{ user_ratings: { from_me: Types.ObjectId[]; to_me: Types.ObjectId[] } }>()
                //     .exec();
                // if (!user_ratings.to_me.includes(new Types.ObjectId(userId))) {
                //     return next(new HttpError("You cannot delete other user's rating."));
                // }
                if (from_id.toString() != userId || to_id.toString() != userId) {
                    return next(new HttpError("You cannot delete other user's rating"));
                }
            }

            const { acknowledged: successfullDeleteUserRate } = await this.userRating.deleteOne({ _id: rateId });
            if (!successfullDeleteUserRate) {
                return next(new HttpError("Failed to delete user rating"));
            }

            const { acknowledged: successfullUpdateBorrow } = await this.borrow.updateOne(
                { _id: borrow_id },
                { $pull: { user_ratings: rateId } },
            );
            if (!successfullUpdateBorrow) {
                return next(new HttpError("Failed to update borrow"));
            }

            const { isOk } = await this.user.bulkWrite([
                { updateOne: { filter: { _id: from_id }, update: { $pull: { "user_ratings.from_me": rateId } } } },
                { updateOne: { filter: { _id: to_id }, update: { $pull: { "user_ratings.to_me": rateId } } } },
            ]);
            if (!isOk) return next(new HttpError("Failed to update users"));

            res.sendStatus(StatusCode.NoContent);
        } catch (error) {
            next(new HttpError(error));
        }
    };
}
