import { IsString } from "class-validator";
import type { MessageContent } from "@interfaces/message";

export default class CreateMessageDto implements Partial<MessageContent> {
    @IsString()
    public content: string;
}
