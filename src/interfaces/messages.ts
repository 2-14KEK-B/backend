import { Document, Types } from "mongoose";

export default interface Message extends Document {
    _id?: Types.ObjectId;
    users: Types.ObjectId[];
    messages_contents: [
        {
            _id?: Types.ObjectId;
            sender_id: Types.ObjectId;
            time: Date;
            content: string;
        },
    ];
}
