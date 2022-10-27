import { ModifyUser } from "@interfaces/user";
import { IsEmail, IsString, IsUrl } from "class-validator";

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
