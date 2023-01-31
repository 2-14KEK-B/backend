import StatusCode from "@utils/statusCodes";
import HttpError from "./Http";

export default class UserAlreadyExistsException extends HttpError {
    constructor() {
        super("error.userAlreadyExists", StatusCode.Conflict);
    }
}
