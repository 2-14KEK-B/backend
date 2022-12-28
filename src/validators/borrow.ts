import "reflect-metadata";
import { Type } from "class-transformer";
import { IsBoolean, IsString, IsArray, ArrayNotEmpty, ValidateNested, IsNumber } from "class-validator";
import type { CreateBorrow, ModifyBorrow } from "@interfaces/borrow";

class BookInBorrowClass {
    @IsString()
    _id: string;

    @IsNumber()
    _version: number;
}

class CreateBorrowDto implements CreateBorrow {
    @IsString()
    public from_id: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BookInBorrowClass)
    public books: BookInBorrowClass[];
}
class ModifyBorrowDto implements ModifyBorrow {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => BookInBorrowClass)
    public books?: BookInBorrowClass[];

    @IsBoolean()
    public verified?: boolean;
}

export { CreateBorrowDto, ModifyBorrowDto };
