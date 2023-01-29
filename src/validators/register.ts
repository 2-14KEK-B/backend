import { IsEmail, IsOptional, IsString, IsUrl } from "class-validator";
import type { RegisterCred } from "@interfaces/authentication";

export default class RegisterDto implements RegisterCred {
    @IsString()
    public username: string;

    @IsString()
    @IsOptional()
    public fullname: string;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    @IsString()
    @IsOptional()
    public locale: string;

    @IsUrl()
    @IsOptional()
    public picture: string;
}
