import { IsEmail, IsOptional, IsString } from "class-validator";
import type { LoginCred } from "@interfaces";

export default class LoginDto implements LoginCred {
    @IsOptional()
    @IsEmail()
    public email: string;

    @IsOptional()
    @IsString()
    public username: string;

    @IsString()
    public password: string;
}
