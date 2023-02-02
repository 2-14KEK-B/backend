import type ID from "./id";

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

export { BookRate, CreateBookRate, ModifyBookRate };
