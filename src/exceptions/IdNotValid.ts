import HttpError from "./Http";
import { StatusCode } from "@utils";

export default class IdNotValidException extends HttpError {
    constructor() {
        super("error.idNotValid", StatusCode.NotFound);
    }
}
