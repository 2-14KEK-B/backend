import type ID from "./id";

interface CreateUserRate {
    borrow: string;
    comment?: string;
    rate: boolean;
}

interface ModifyUserRate {
    comment?: string;
    rate?: boolean;
}

interface UserRate {
    _id?: ID;
    from: ID;
    to: ID;
    comment?: string;
    rate: boolean;
    borrow: ID;
    createdAt: Date;
}

export { UserRate, CreateUserRate, ModifyUserRate };
