import { model } from "mongoose";
import borrowSchema from "@schemas/borrow";

const borrowModel = model("Borrow", borrowSchema, "borrows");

export default borrowModel;
