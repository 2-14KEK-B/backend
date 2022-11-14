import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class UnauthorizedException extends HttpError {
    constructor() {
        super("Unauthorized", StatusCode.Unauthorized);
    }
}
