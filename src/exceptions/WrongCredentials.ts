import HttpError from "./Http";

export default class WrongCredentialsException extends HttpError {
    constructor() {
        super(401, "Wrong credentials provided");
    }
}
