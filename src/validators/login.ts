import { IsEmail, IsString } from "class-validator";
import type { LoginCred } from "@interfaces/authentication";

export default class LoginDto implements LoginCred {
    @IsEmail()
    public email: string;

    @IsString()
    public password: string;
}
