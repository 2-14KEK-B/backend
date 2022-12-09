import { IsBoolean, IsString } from "class-validator";
import type { CreateBorrow, ModifyBorrow } from "@interfaces/borrow";

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

export { CreateBorrowDto, ModifyBorrowDto };
