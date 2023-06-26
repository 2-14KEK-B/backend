import { LoginCred, RegisterCred } from "@interfaces/authentication";
import { Book, CreateBook, ModifyBook } from "@interfaces/book";
import { BookRate, CreateBookRate, ModifyBookRate } from "@interfaces/bookRate";
import { Borrow, CreateBorrow, ModifyBorrow } from "@interfaces/borrow";
import Controller from "@interfaces/controller";
import ID from "@interfaces/id";
import { Message, MessageContent, CreateMessageContent } from "@interfaces/message";
import { Notification, CreateNotification, docType, notiType } from "@interfaces/notification";
import { User, CreateUser, ModifyUser } from "@interfaces/user";
import { UserRate, CreateUserRate, ModifyUserRate } from "@interfaces/userRate";

export type {
    LoginCred,
    RegisterCred,
    Book,
    CreateBook,
    ModifyBook,
    BookRate,
    CreateBookRate,
    ModifyBookRate,
    Borrow,
    CreateBorrow,
    ModifyBorrow,
    Controller,
    ID,
    Message,
    MessageContent,
    CreateMessageContent,
    Notification,
    CreateNotification,
    docType,
    notiType,
    User,
    CreateUser,
    ModifyUser,
    UserRate,
    CreateUserRate,
    ModifyUserRate,
};
