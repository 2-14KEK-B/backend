import { IsBoolean, IsNumber, IsNumberString, IsOptional, IsString, IsUrl } from "class-validator";
import type { CreateBookRate, ModifyBookRate } from "@interfaces/bookRate";
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

class CreateBookRateDto implements CreateBookRate {
    @IsNumber()
    public rate: number;

    @IsOptional()
    @IsString()
    public comment?: string;
}

class ModifyBookRateDto implements ModifyBookRate {
    @IsNumber()
    public rate: number;

    @IsString()
    public comment: string;
}

export { CreateBookDto, ModifyBookDto, CreateBookRateDto, ModifyBookRateDto };
