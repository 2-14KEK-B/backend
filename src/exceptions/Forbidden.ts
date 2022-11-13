import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class ForbiddenException extends HttpError {
    constructor() {
        super("Forbidden", StatusCode.Forbidden);
    }
}
