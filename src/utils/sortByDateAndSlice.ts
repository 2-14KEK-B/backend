import type { SortOrder } from "mongoose";

/**
 * Return array as sorted by Date and sliced
 * @param array Array to be sort and slice
 * @param sort Sortorder, default is "desc"
 * @param skip Number of items to be skipped
 * @param limit Number to maximise items to be return
 * @returns Array of items || []
 */
export default function sortByDateAndSlice<T extends { createdAt: Date }>(
    array: Array<T>,
    sort: SortOrder = "desc",
    skip?: string,
    limit?: string,
): Array<T> | [] {
    if (array.length == 0) return [];

    const skipAsNumber = Number.parseInt(skip as string) || 0;
    const limitAsNumber = Number.parseInt(limit as string) || 25 + skipAsNumber;

    return array
        .sort((a, b) => {
            if (Array<SortOrder>("asc", "ascending", 1).includes(sort)) {
                return b.createdAt.getTime() - a.createdAt.getTime();
            } else {
                return a.createdAt.getTime() - b.createdAt.getTime();
            }
        })
        .slice(skipAsNumber, limitAsNumber);
}
