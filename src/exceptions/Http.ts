import StatusCode from "@utils/statusCodes";

export default class HttpError extends Error {
    constructor(public message: string, public status: number = StatusCode.BadRequest) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype);
        this.name = Error.name;
        Error.captureStackTrace(this);
    }
}
