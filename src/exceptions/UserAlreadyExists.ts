import HttpError from "./Http";

export default class UserAlreadyExistsException extends HttpError {
    constructor(email: string) {
        super(400, `User with email ${email} already exists`);
    }
}
