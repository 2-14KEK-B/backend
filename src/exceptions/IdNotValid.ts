import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class IdNotValidException extends HttpError {
    constructor(id?: string) {
        super(id ? `This ${id} id is not valid.` : "Id is not valid.", StatusCode.NotFound);
    }
}
