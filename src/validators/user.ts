import { IsEmail, IsOptional, IsString, IsUrl } from "class-validator";

export default class UserDto {
    @IsString()
    @IsOptional()
    public username: string;

    @IsString()
    @IsOptional()
    public fullname: string;

    @IsEmail()
    @IsOptional()
    public email: string;

    @IsString()
    @IsOptional()
    public password: string;

    @IsString()
    @IsOptional()
    public locale: string;

    @IsUrl()
    @IsOptional()
    public picture: string;
}
