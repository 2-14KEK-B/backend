import { IsMongoId, ArrayMinSize, IsOptional } from "class-validator";
import type { CreateBorrow, ModifyBorrow } from "@interfaces";

class CreateBorrowDto implements CreateBorrow {
    @IsMongoId()
    @IsOptional()
    public to: string;

    @IsMongoId()
    @IsOptional()
    public from: string;

    @IsMongoId({ each: true })
    @ArrayMinSize(1)
    public books: string[];
}
class ModifyBorrowDto implements ModifyBorrow {
    @IsMongoId({ each: true })
    @ArrayMinSize(1)
    public books?: string[];
}

export { CreateBorrowDto, ModifyBorrowDto };
