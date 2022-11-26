import { IsBoolean, IsNumber, IsNumberString, IsOptional, IsString, IsUrl } from "class-validator";
import type { CreateBookRating } from "@interfaces/bookRating";
import type { CreateBook, ModifyBook } from "@interfaces/book";

class CreateBookDto implements CreateBook {
    @IsString()
    public author: string;

    @IsString()
    public title: string;

    @IsUrl()
    @IsOptional()
    public picture: string;

    @IsString({ each: true })
    @IsOptional()
    public category: string[];

    @IsNumberString()
    @IsOptional()
    public price: number;

    @IsBoolean()
    public for_borrow: boolean;
}

class ModifyBookDto implements ModifyBook {
    @IsString()
    public author: string;

    @IsString()
    public title: string;

    @IsUrl()
    public picture: string;

    @IsString({ each: true })
    public category: string[];

    @IsNumberString()
    public price: number;

    @IsBoolean()
    public for_borrow: boolean;
}

class BookRatingDto implements CreateBookRating {
    @IsNumber()
    public rate: number;

    @IsString()
    @IsOptional()
    public comment?: string;
}

export { CreateBookDto, ModifyBookDto, BookRatingDto };
