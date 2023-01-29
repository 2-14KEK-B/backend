import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class WrongCredentialsException extends HttpError {
    constructor() {
        super("wrongCredentials", StatusCode.Unauthorized);
    }
}
