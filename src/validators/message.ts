import { IsString } from "class-validator";
import type { MessageContent } from "@interfaces";

export default class CreateMessageDto implements Partial<MessageContent> {
    @IsString()
    public content: string;
}
