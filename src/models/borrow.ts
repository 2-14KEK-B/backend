import { Model, model, type PaginateModel } from "mongoose";
import { borrowSchema } from "@schemas";
import type { Borrow } from "@interfaces";

interface BorrowModel extends PaginateModel<Borrow>, Model<Borrow> {}

const borrowModel = model<Borrow, BorrowModel>("Borrow", borrowSchema, "borrows");

export default borrowModel;
