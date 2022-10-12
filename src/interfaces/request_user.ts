import { Request } from "express";
import { User } from "@interfaces/user";

export interface RequestWithUser extends Request {
    user: User;
}
