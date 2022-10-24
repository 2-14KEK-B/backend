import HttpError from "./Http";

export default class IdNotValidException extends HttpError {
    constructor(id: string) {
        super(404, `This ${id} id is not valid.`);
    }
}
