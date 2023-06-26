import type { ID } from ".";

interface BookRate {
    _id?: ID;
    from: ID;
    createdAt: Date;
    updatedAt?: Date;
    comment?: string;
    rate: number;
}

interface CreateBookRate {
    rate: number;
    comment?: string;
}
interface ModifyBookRate {
    rate?: number;
    comment?: string;
}

export type { BookRate, CreateBookRate, ModifyBookRate };
