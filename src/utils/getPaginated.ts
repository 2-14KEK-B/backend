import type { Model, FilterQuery, SortOrder } from "mongoose";

// TODO: make it more usable

export default async function getPaginated<T extends { createdAt: Date }>(
    model: Model<T>,
    query?: FilterQuery<T>,
    sort: SortOrder = "desc",
    sortBy?: keyof Partial<T> | string,
    skip?: number | string,
    limit?: number | string,
): Promise<T[]> {
    return await model
        .find(query ?? {})
        .sort(`${sort == "asc" ? "" : "-"}${sortBy as string}` ?? { createdAt: sort })
        .skip(Number.parseInt(skip as string) ?? 0)
        .limit(Number.parseInt(limit as string) ?? 10)
        .lean<T[]>()
        .exec();
}
