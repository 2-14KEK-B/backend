import StatusCode from "@utils/statusCodes";
export default class HttpError extends Error {
    constructor(public message: string, public status: number = StatusCode.BadRequest) {
        super(message);
        this.status = status;
        this.message = message;
    }
}
