import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class IdNotValidException extends HttpError {
    constructor(id: string) {
        super(`This ${id} id is not valid.`, StatusCode.NotFound);
    }
}
