type ID = string | Types.ObjectId;
interface MockBook {
    _id?: ID;
    uploader?: ID;
    author: string;
    title: string;
    for_borrow: boolean;
    available?: boolean;
    ratings?: BookRating[];
}
interface MockUser {
    _id?: ID;
    email: string;
    password: string;
    role?: string;
    books?: (Book | ID)[];
    borrows?: (Borrow | ID)[];
    rated_books?: ID[];
    messages?: (Message | ID)[];
}
interface MockBorrow {
    _id?: ID;
    from_id?: ID;
    updated_on?: Date;
    to_id: ID;
    books?: (Book | ID)[];
    verified?: boolean;
}
interface MockMessage {
    _id?: ID;
    users: ID[];
    message_contents: {
        sender_id: ID;
        content: string;
    }[];
}

export { MockBook, MockUser, MockBorrow, MockMessage };
