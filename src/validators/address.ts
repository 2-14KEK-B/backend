/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsString } from "class-validator";

export default class CreateAddressDto {
    @IsString()
    public street: string;
    @IsString()
    public city: string;
    @IsString()
    public country: string;
}
