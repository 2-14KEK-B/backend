import StatusCode from "@utils/statusCodes";
import env from "@config/validateEnv";
import type en from "../locale/en";

export type Slots = Record<string, string | number> | null;

export default class HttpError extends Error {
    constructor(
        // eslint-disable-next-line @typescript-eslint/ban-types
        public message: keyof typeof en.error | (string & {}) = "default",
        public status: number = StatusCode.BadRequest,
        public slots: Slots = null,
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
