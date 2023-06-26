import { IsEmail, IsString, IsUrl } from "class-validator";
import type { ModifyUser } from "@interfaces";

export default class ModifyUserDto implements ModifyUser {
    @IsString()
    public username: string;

    @IsString()
    public fullname: string;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    @IsString()
    public locale: string;

    @IsUrl()
    public picture: string;
}
