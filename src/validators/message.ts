import { IsString } from "class-validator";
import type { CreateMessage } from "@interfaces/message";

export default class CreateMessageDto implements CreateMessage {
    @IsString()
    public from_id: string;

    @IsString()
    public to_id: string;

    @IsString()
    public content: string;
}
