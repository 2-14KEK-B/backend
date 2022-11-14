import { IsString } from "class-validator";
import type { CreateMessage } from "@interfaces/message";

export default class CreateMessageDto implements CreateMessage {
    @IsString()
    public content: string;
}
