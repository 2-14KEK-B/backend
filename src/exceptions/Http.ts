import env from "@config/validateEnv";
import { StatusCode } from "@utils";

export default class HttpError extends Error {
    constructor(public message = "error.default", public status = StatusCode.BadRequest) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype);
        this.name = Error.name;
        Error.captureStackTrace(this);
        if (env.isDev) {
            /* istanbul ignore next */
            console.log(this);
        }
    }
}
