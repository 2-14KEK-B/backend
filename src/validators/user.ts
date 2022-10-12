/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsOptional, IsString, ValidateNested } from "class-validator";
import CreateAddressDto from "@validators/address";

export default class CreateUserDto {
    @IsString()
    public name: string;

    @IsString()
    public email: string;

    @IsString()
    public password: string;

    @IsOptional()
    @ValidateNested()
    public address?: CreateAddressDto;
}
