import { IsBoolean, IsOptional, IsString, IsMongoId } from "class-validator";
import type { CreateUserRate, ModifyUserRate } from "@interfaces";

class CreateUserRateDto implements CreateUserRate {
    @IsMongoId()
    public borrow: string;

    @IsBoolean()
    public rate: boolean;

    @IsString()
    @IsOptional()
    public comment?: string;
}

class ModifyUserRateDto implements ModifyUserRate {
    @IsBoolean()
    public rate: boolean;

    @IsString()
    public comment: string;
}

export { CreateUserRateDto, ModifyUserRateDto };
