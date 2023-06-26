import HttpError from "./Http";
import { StatusCode } from "@utils";

export default class ForbiddenException extends HttpError {
    constructor() {
        super("error.forbidden", StatusCode.Forbidden);
    }
}
