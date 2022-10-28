import { LoginCred } from "@interfaces/auth";
import { IsEmail, IsString } from "class-validator";

export default class LoginDto implements LoginCred {
    @IsEmail()
    public email: string;

    @IsString()
    public password: string;
}
