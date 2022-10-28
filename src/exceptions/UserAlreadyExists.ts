import HttpError from "./Http";

export default class UserAlreadyExistsException extends HttpError {
    constructor(email: string) {
        super(`User with email ${email} already exists`);
    }
}
