import { Model, Schema, type UpdateWriteOpResult } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { User, docType, Notification, notiType } from "@interfaces";

const notificationSchema = new Schema<Notification>(
    {
        from: {
            type: Schema.Types.ObjectId,
            required: [true, "notification.fromRequired"],
            ref: "User",
        },
        doc_id: {
            type: Schema.Types.ObjectId,
            required: [true, "notification.toRequired"],
        },
        doc_type: {
            type: String,
            enum: {
                values: ["lend", "borrow", "user_rate"],
                message: "notification.onlyFromDocType",
            },
            required: [true, "notification.docTypeRequired"],
        },
        noti_type: {
            type: String,
            enum: {
                values: ["create", "update", "delete", "verify"],
                message: "notification.onlyFromNotiType",
            },
            required: [true, "notification.notiTypeRequired"],
        },
        seen: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false },
);

const userSchema = new Schema<User>(
    {
        username: {
            type: String,
            trim: true,
            required: [true, "user.usernameRequired"],
            minlength: [6, "user.usernameMinLength"],
            maxlength: [32, "user.usernameMaxLength"],
            unique: true,
            sparse: true,
        },
        fullname: {
            type: String,
            minlength: [2, "user.fullnameMinLength"],
            maxlength: [64, "user.fullnameMaxLength"],
        },
        password: {
            type: String,
            required: [true, "user.passwordRequired"],
            select: 0,
        },
        email: {
            type: String,
            trim: true,
            required: [true, "user.emailRequired"],
            minlength: [8, "user.emailMinLength"],
            maxlength: [64, "user.emailMaxLength"],
            immutable: true,
            index: true,
            unique: true,
        },
        verification_token: {
            type: String,
            select: 0,
            unique: true,
            sparse: true,
        },
        password_reset_token: {
            type: String,
            select: 0,
            unique: true,
            sparse: true,
        },
        email_is_verified: {
            type: Boolean,
            default: false,
        },
        locale: {
            type: String,
            default: "hu",
            enum: {
                values: ["hu", "en"],
                message: "user.onlyFromLocale",
            },
        },
        picture: {
            type: String,
            trim: true,
        },
        role: { type: String },
        books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
        rated_books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
        messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
        borrows: [{ type: Schema.Types.ObjectId, ref: "Borrow" }],
        user_rates: {
            from: [{ type: Schema.Types.ObjectId, ref: "UserRate" }],
            to: [{ type: Schema.Types.ObjectId, ref: "UserRate" }],
        },
        notifications: [notificationSchema],
    },
    { timestamps: true, versionKey: false },
);

userSchema.path("picture").validate(function (val: string) {
    if (val.includes("googleusercontent.com")) return true;
    const imgUrlRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/;
    return imgUrlRegex.test(val);
}, "picture.invalidUrl");

userSchema.statics["getInitialData"] = async function (this: Model<User>, userId: string): Promise<User | null> {
    try {
        return await this.findById<User>(userId)
            .populate(["books"])
            .populate({
                path: "rated_books",
                select: "picture author title",
            })
            .populate({
                path: "borrows",
                populate: [
                    {
                        path: "from to",
                        select: "fullname username email picture",
                    },
                    {
                        path: "books",
                        select: "author title picture",
                    },
                    {
                        path: "user_rates",
                        populate: { path: "to from", select: "username fullname picture email" },
                    },
                ],
            })
            .populate({
                path: "messages",
                options: {
                    projection: {
                        message_contents: { $slice: -25 },
                    },
                },
                populate: {
                    path: "users",
                    select: "fullname username email picture",
                },
            })
            .populate({
                path: "user_rates",
                populate: [
                    {
                        path: "from",
                        select: "-from",
                        populate: { path: "to", select: "username fullname picture email" },
                    },
                    {
                        path: "to",
                        select: "-to",
                        populate: {
                            path: "from",
                            select: "username fullname picture email",
                        },
                    },
                ],
            })
            .populate({
                path: "notifications",
                populate: {
                    path: "from",
                    select: "username fullname picture email",
                },
            })
            .exec();
    } catch (error) {
        /* istanbul ignore next */
        throw new Error(error.message);
    }
};

userSchema.statics["createNotification"] = async function (
    to_id: string,
    from_id: string,
    doc_id: string,
    doc_type: docType,
    noti_type: notiType,
): Promise<UpdateWriteOpResult> {
    return await this.updateOne(
        { _id: to_id },
        {
            $push: {
                notifications: { from: from_id, doc_id: doc_id, doc_type: doc_type, noti_type: noti_type },
            },
        },
    ).exec();
};

userSchema.plugin(paginate);

export default userSchema;
