import { IsBoolean, IsMongoId, ArrayMinSize } from "class-validator";
import type { CreateBorrow, ModifyBorrow } from "@interfaces/borrow";

class CreateBorrowDto implements CreateBorrow {
    @IsMongoId()
    public from: string;

    @IsMongoId({ each: true })
    @ArrayMinSize(1)
    public books: string[];
}
class ModifyBorrowDto implements ModifyBorrow {
    @IsMongoId({ each: true })
    @ArrayMinSize(1)
    public books?: string[];

    @IsBoolean()
    public verified?: boolean;
}

export { CreateBorrowDto, ModifyBorrowDto };
