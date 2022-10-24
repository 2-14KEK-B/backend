import { model } from "mongoose";
import messageSchema from "@schemas/message";

const messageModel = model("Message", messageSchema, "messages");

export default messageModel;
