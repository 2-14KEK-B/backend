import { Model, model, PaginateModel, UpdateWriteOpResult } from "mongoose";
import userSchema from "@schemas/user";
import type { User } from "@interfaces/user";
import type { docType, notiType } from "@interfaces/notification";

interface UserModel extends PaginateModel<User>, Model<User> {
    getInitialData(userId: string): Promise<User>;
    createNotification(
        to_id: string,
        from_id: string,
        doc_id: string,
        doc_type: docType,
        noti_type: notiType,
    ): Promise<UpdateWriteOpResult>;
}

const userModel = model<User, UserModel>("User", userSchema, "users");

export default userModel;
