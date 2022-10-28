import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class UserNotFoundException extends HttpError {
    constructor(id?: string, email?: string) {
        super(id ? `User with id ${id} not found` : email ? `User with email ${email} not found` : "User not found", StatusCode.NotFound);
    }
}
