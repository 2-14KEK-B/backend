import HttpError from "./Http";

export default class UserNotFoundException extends HttpError {
    constructor(id?: string, email?: string) {
        super(404, id ? `User with id ${id} not found` : email ? `User with email ${email} not found` : "User not found");
    }
}
