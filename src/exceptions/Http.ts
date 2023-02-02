import StatusCode from "@utils/statusCodes";
import env from "@config/validateEnv";

export default class HttpError extends Error {
    constructor(
        // eslint-disable-next-line @typescript-eslint/ban-types
        public message = "error.default",
        public status: number = StatusCode.BadRequest,
    ) {
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
