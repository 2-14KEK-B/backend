import { Schema, UpdateWriteOpResult } from "mongoose";
import paginate from "mongoose-paginate-v2";
// import { dictionaries } from "@utils/dictionaries";
import type { User } from "@interfaces/user";
import type { docType, Notification, notiType } from "@interfaces/notification";

const notificationSchema = new Schema<Notification>(
    {
        from: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        doc_id: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        doc_type: {
            type: String,
            enum: ["lend", "borrow", "user_rate"],
            required: true,
        },
        noti_type: {
            type: String,
            enum: ["create", "update", "delete", "verify"],
            required: true,
        },
        seen: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false },
);

const userSchema = new Schema<User>(
    {
        username: { type: String, required: true, minlength: 6, maxlength: 32, trim: true, unique: true, sparse: true },
        fullname: { type: String, minlength: 6, maxlength: 64 },
        password: { type: String, required: true, select: 0, minlength: 8, maxlength: 64, trim: true },
        email: {
            type: String,
            required: true,
            minlength: 8,
            maxlength: 64,
            trim: true,
            immutable: true,
            index: true,
            unique: true,
        },
        verification_token: { type: String, select: 0, unique: true, sparse: true },
        password_reset_token: { type: String, select: 0, unique: true, sparse: true },
        email_is_verified: { type: Boolean, default: false },
        locale: { type: String, default: "hu", enum: ["hu", "en"] },
        picture: {
            type: String,
            trim: true,
            // validate: {
            //     validator: function (v: string) {
            //         return /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/.test(v);
            //     },
            //     message: () => dictionaries[global.language].error.invalidUrl,
            // },
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

userSchema.path("picture").validate(function (val) {
    const imgUrlRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/;
    // const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
    return imgUrlRegex.test(val);
}, "Invalid URL");

userSchema.statics["getInitialData"] = async function (userId: string): Promise<User> {
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
