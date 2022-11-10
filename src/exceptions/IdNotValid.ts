import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class IdNotValidException extends HttpError {
    constructor(id?: string) {
        super(id ? `This ${id} id is not valid.` : "Not valid id.", StatusCode.NotFound);
    }
}
