import HttpError from "./Http";
import StatusCode from "@utils/statusCodes";

export default class IdNotValidException extends HttpError {
    constructor(id: string | string[]) {
        super(typeof id === "string" ? `This ${id} id is not valid.` : "Not valid ids.", StatusCode.NotFound);
    }
}
