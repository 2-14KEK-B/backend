import { Model, model, PaginateModel } from "mongoose";
import borrowSchema from "@schemas/borrow";
import type { Borrow } from "@interfaces/borrow";

interface BorrowModel extends PaginateModel<Borrow>, Model<Borrow> {}

const borrowModel = model<Borrow, BorrowModel>("Borrow", borrowSchema, "borrows");

export default borrowModel;
