import HttpError from "./Http";
import { StatusCode } from "@utils";

export default class UnauthorizedException extends HttpError {
    constructor() {
        super("error.unauthorized", StatusCode.Unauthorized);
    }
}
