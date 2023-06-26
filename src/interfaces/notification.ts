import type { ID } from ".";

type docType = "lend" | "borrow" | "user_rate";
type notiType = "create" | "update" | "delete" | "verify";

interface Notification {
    _id: ID;
    from: ID;
    doc_id: ID;
    doc_type: docType;
    noti_type: notiType;
    seen: boolean;
}

interface CreateNotification {
    doc_id: string;
    doc_type: docType;
    not_type: notiType;
}

export type { Notification, CreateNotification, docType, notiType };
