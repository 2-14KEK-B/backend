import type { SortOrder } from "mongoose";

export default function sortByDate<T extends { createdAt: Date }>(array: Array<T>, sort: SortOrder | string) {
    return array.sort((data1, data2) => {
        if (sort === "asc" || sort === "ascending") {
            return data2.createdAt.getTime() - data1.createdAt.getTime();
        } else {
            return data1.createdAt.getTime() - data2.createdAt.getTime();
        }
    });
}
