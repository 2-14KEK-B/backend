import HttpError from "./Http";
import { StatusCode } from "@utils";

export default class UserAlreadyExistsException extends HttpError {
    constructor() {
        super("error.userAlreadyExists", StatusCode.Conflict);
    }
}
