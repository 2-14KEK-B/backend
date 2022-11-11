import { IsBoolean, IsOptional, IsString } from "class-validator";
import type { CreateBorrow, ModifyBorrow, UserRating } from "@interfaces/borrow";

class CreateBorrowDto implements CreateBorrow {
    @IsString()
    public from_id: string;

    @IsString({ each: true })
    public books: string[];
}
class ModifyBorrowDto implements ModifyBorrow {
    @IsString({ each: true })
    public books?: string[];

    @IsBoolean()
    public verified?: boolean;
}

class UserRatingDto implements UserRating {
    @IsBoolean()
    public rating: boolean;

    @IsString()
    @IsOptional()
    public comment?: string;
}

export { CreateBorrowDto, ModifyBorrowDto, UserRatingDto };
