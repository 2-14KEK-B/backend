import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class WrongCredentialsException extends HttpError {
    constructor() {
        super("error.wrongCredentials", StatusCode.Unauthorized);
    }
}
