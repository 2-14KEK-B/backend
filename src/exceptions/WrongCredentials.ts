import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class WrongCredentialsException extends HttpError {
    constructor() {
        super("Wrong credentials provided", StatusCode.Unauthorized);
    }
}
