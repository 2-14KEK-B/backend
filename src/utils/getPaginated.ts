import type { Model, FilterQuery, SortOrder } from "mongoose";

/**
 * Returns sorted Array of leaned documents
 * @param model Mongoose model
 * @param query FilterQuery for model.find() function
 * @param skip Number of documents to be skipped
 * @param limit Number to maximise documents to be return
 * @param sort Sorting documents, default is createdAt as "desc"
 * @param sortBy Keyof Mongoose Schema to be sorted, working with "sort" param
 * @returns Array of leaned documents
 */
export default async function getPaginated<T extends { createdAt: Date }>(
    model: Model<T>,
    query?: FilterQuery<T>,
    skip?: string,
    limit?: string,
    sort: SortOrder = "desc",
    sortBy?: keyof Partial<T> | string,
): Promise<T[]> {
    let sorting = {
        createdAt: "desc",
    } as { [_ in keyof Partial<T>]: SortOrder } | string;

    if (sort && sortBy) {
        sorting = `${sort == "asc" ? "" : "-"}${sortBy.toString()}`;
    }

    return await model
        .find(query || {})
        .sort(sorting)
        .skip(Number.parseInt(skip as string) || 0)
        .limit(Number.parseInt(limit as string) || 10)
        .lean<T[]>()
        .exec();
}
