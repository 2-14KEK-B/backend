import type { FilterQuery, SortOrder, PaginateModel, PaginateResult } from "mongoose";

/**
 * Returns sorted Array of leaned documents
 * @param model Mongoose model
 * @param query FilterQuery for model.find() function
 * @param skip Number of documents to be skipped
 * @param limit Number to maximise documents to be return
 * @param sort Sorting documents, default is createdAt as "desc"
 * @param sortBy Keyof Mongoose Schema to be sorted
 * @returns Array of leaned documents
 */
export default async function getPaginated<T extends { createdAt: Date }>(
    model: PaginateModel<T>,
    query?: FilterQuery<T>,
    skip?: string,
    limit?: string,
    sort: SortOrder = "desc",
    sortBy?: keyof Partial<T> | string,
): Promise<PaginateResult<T>> {
    let sorting = {
        createdAt: sort,
    } as { [_ in keyof Partial<T>]: SortOrder } | string;

    if (sortBy) {
        sorting = `${sort == "desc" ? "-" : ""}${sortBy.toString()}`;
    }

    const skipAsNum = Number.parseInt(skip as string),
        limitAsNum = Number.parseInt(limit as string);

    const result = await model.paginate(query || {}, {
        offset: isNaN(skipAsNum) ? 0 : skipAsNum,
        limit: isNaN(limitAsNum) ? 10 : limitAsNum,
        sort: sorting,
        lean: true,
        leanWithId: false,
    });

    return result;
}
