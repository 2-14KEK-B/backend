export default {
    success: {
        logout: "Logged out successFully.",
        emailVerification: "E-mail verified successfully.",
        passwordReset: "Password modified successfully",
        passwordResetEmail: "Password modification e-mail sent successfully.",
    },
    error: {
        default: "Something went wrong.",
        defaultPassword: "Something wrong with the password.",
        forbidden: "You do not have access!",
        unauthorized: "Please login.",
        wrongCredentials: "Wrong credentials provided.",
        userAlreadyExists: "User already exists, please try again with different e-mail or username.",
        idNotValid: "This identifier is not valid.",
        invalidUrl: "Invalid URL.",
        emailNotFoundOrVerified: "E-mail is not found or not verified.",
        emailAlreadySent: "The e-mail has already been sent. You can also check the 'spam' directory.",
        tokenAlreadyUsed: "This token already has been used",
        tokenNotValidOrExpired: "Token is not valid or expired.",
        failedUserCreation: "Something wrong with the user creation.",
        emailFailedVerify: "Failed to verify the email.",
        emailAlreadyVerified: "This e-mail is already verified.",
        emailSentNotVerified: "E-mail has been sent to your given email address. Please verify it.",
        failedGoogle: "Failed to receive data from Google.",
        fromOrTo: "Either 'from' or 'to' field is required.",
        alreadyInBorrow: "You can't send a request for this book now, it's probably already been lent.",

        // book
        failedGetBooks: "Failed to get books.",
        failedCreateBook: "Failed to create book.",
        failedUpdateBook: "Failed to update book.",
        failedDeleteBook: "Failed to delete book.",
        failedGetBookById: "Failed to get book by id.",

        // book_rate
        notHaveBookRate: "You do not have book rate with this identifier.",
        notContainBookRate: "This book does not contain rate with this identifier.",
        alreadyRatedBook: "Already rated this book.",
        failedGetBookRates: "Failed to get book rates.",
        failedCreateBookRate: "Failed to create book rate.",
        failedUpdateBookRate: "Failed to update book rate.",
        failedDeleteBookRate: "Failed to delete book rate.",

        // message
        failedGetMessages: "Failed to get messages.",
        failedGetMessagesByUserId: "Failed to get message contents by this user.",
        failedCreateMessage: "Failed to create message.",
        failedUpdateMessageSeen: "Failed to update the 'seen' fields of the message contents.",
        failedDeleteMessage: "Failed to delete message by id.",
        failedGetMessageContent: "Failed to get message content by id.",
        failedDeleteMessageContent: "Failed to delete message content.",

        // borrow
        failedGetBorrows: "Failed to get borrows.",
        failedGetBorrowById: "Failed to get borrow by id.",
        booksAreForLend: "These books are uploaded for lend.",
        borrowFromYourself: "You cannot borrow books to yourself.",
        failedCreateBorrow: "Failed to create borrow.",
        cannotModifyBorrow: "You cannot modify this borrow.",
        cannotBorrowBook: "This book is not uploaded for that.",
        failedUpdateBorrow: "Failed to update borrow.",
        failedDeleteBorrow: "Failed to delete borrow.",
        cannotModifyVerified: "You cannot modify the 'verified' field.",
        cannotDeleteBorrow: "You cannot delete this borrow.",

        // lend
        booksAreForBorrow: "These books are uploaded for borrow.",
        lendToYourself: "You cannot lend books to yourself.",

        // user
        failedCreateUser: "Failed to create user account.",
        failedUpdateUser: "Failed to update user.",
        failedUpdateUsers: "Failed to update users.",
        failedUpdateYourUser: "Failed to modify your profile.",
        failedDeleteYourUser: "Failed to delete your profile.",
        failedDeleteUser: "Failed to delete user.",

        // user_rate
        failedGetUserRates: "Failed to get the user rates.",
        failedGetUserRateById: "Failed to get the user rate by id.",
        failedGetUserRateByUserId: "Failed to get the user rate by user id.",
        failedGetUserRateByBorrowId: "Failed to get the user rate by borrow id.",
        notHaveUserRateById: "You do not have user rate by this id.",
        cannotIfBorrowNotVerified: "You can not rate user if borrow is not verified.",
        failedUpdateUserRate: "Failed to modify user rate.",
        failedCreateUserRate: "Failed to create user rate.",
        failedDeleteUserRate: "Failed to delete user rate.",

        // notification
        failedGetNotifications: "Failed to get notifications.",
        failedGetNotificationById: "Failed to get notification by id.",
        failedCreateNotification: "Failed to create notification.",
        failedUpdateNotificationSeen: "Failed to update the 'seen' fields of the notification.",
        failedDeleteNotificationById: "Failed to delete notification by id.",
    },
    email: {
        passwordSubject: "Password modification",
        passwordBody:
            "<div>Hi,</div><br /><div>Password modification link: #link#.</div><br /><div>Thanks! The BookSwap team</div>",
        verifySubject: "Email verification",
        verifyBody:
            "<div>Hi,</div><br /><div>You registered an account on BookSwap, before being able to use your account you need to verify that this is your email address by clicking here: #link#.</div><br /><div>Thanks! The BookSwap team</div>",
    },
} as const;
