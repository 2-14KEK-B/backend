import { model } from "mongoose";
import { postSchema } from "@schemas/post";
import { Post } from "@interfaces/post";

export const postModel = model<Post>("Post", postSchema);
