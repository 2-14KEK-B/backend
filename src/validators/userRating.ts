import type { CreateUserRating } from "@interfaces/userRating";
import { IsBoolean, IsOptional, IsString } from "class-validator";

class UserRatingDto implements CreateUserRating {
    @IsBoolean()
    public rate: boolean;

    @IsString()
    @IsOptional()
    public comment?: string;
}

export { UserRatingDto };
