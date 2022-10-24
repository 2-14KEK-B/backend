import { IsString } from "class-validator";

export default class RegisterDto {
    @IsString()
    public email: string;

    @IsString()
    public password: string;

    @IsString()
    public name: string;
}
