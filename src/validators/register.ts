import { IsEmail, IsOptional, IsString, IsUrl } from "class-validator";

export default class RegisterDto {
    @IsString()
    @IsOptional()
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
