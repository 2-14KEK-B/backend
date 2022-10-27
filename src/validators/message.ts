import { CreateMessage } from "@interfaces/message";
import { IsString } from "class-validator";

export default class CreateMessageDto implements CreateMessage {
    @IsString()
    public from_id: string;

    @IsString()
    public to_id: string;

    @IsString()
    public content: string;
}
