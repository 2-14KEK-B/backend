import { LoginCred } from "@interfaces/authentication";
import { IsEmail, IsString } from "class-validator";

export default class LoginDto implements LoginCred {
    @IsEmail()
    public email: string;

    @IsString()
    public password: string;
}
