import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class IdNotValidException extends HttpError {
    constructor() {
        super("idNotValid", StatusCode.NotFound);
    }
}
