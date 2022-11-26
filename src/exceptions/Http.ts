import StatusCode from "@utils/statusCodes";
import env from "@utils/validateEnv";

export default class HttpError extends Error {
    constructor(public message: string = "Something went wrong", public status: number = StatusCode.BadRequest) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype);
        this.name = Error.name;
        Error.captureStackTrace(this);
        if (env.isDevelopment) console.log(this);
    }
}
