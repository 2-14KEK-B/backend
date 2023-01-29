export default {
    success: {
        logout: "Sikeresen kijelentkeztél.",
        emailVerification: "E-mail visszaigazolása sikeresen megtörtént.",
        passwordReset: "Jelszó módosítása sikeresen megtörtént.",
        passwordResetEmail: "Jelszó módosításához szükséges e-mail el lett küldve.",
    },
    error: {
        default: "Valami gond történt.",
        defaultPassword: "Hiba történt a jelszóval.",
        forbidden: "Nincs jogosultságod.",
        unauthorized: "Kérlek, jelentkezz be.",
        wrongCredentials: "Helytelen hitelesítő adatok.",
        userAlreadyExists: "Felhasználó már létezik, kérlek próbáld meg újra más e-mail címmel vagy felhasználónévvel.",
        idNotValid: "Ez az azonosító nem érvényes.",
        invalidUrl: "Érvénytelen URL.",
        emailNotFoundOrVerified: "Email cím nem található vagy nincs visszaigazolva.",
        emailAlreadySent: "Az e-mail már el lett küldve. Nézd meg a 'spam' könyvtárban is.",
        tokenAlreadyUsed: "Ezt a tokent már használták.",
        tokenNotValidOrExpired: "Token nem valódi vagy lejárt.",
        failedUserCreation: "Hiba történt a fiók készítésekor.",
        emailFailedVerify: "Nem sikerült hitelesíteni az e-mail címet.",
        emailAlreadyVerified: "Ez az e-mail cím már hitelesítve van.",
        emailSentNotVerified: "Az e-mail el lett küldve az e-mail címedre. Kérlek igazold vissza.",
        failedGoogle: "Hiba történt az adatok Google-tól való lekérésekor.",
        fromOrTo: "Kötelező megadni vagy a 'from' vagy a 'to' mezőt.",
        alreadyInBorrow: "Nem küldhetsz most erről a könyvről kérést, minden bizonnyal már kölcsön lett adva.",

        // book
        failedGetBooks: "Hiba történt a könyvek lekérésekor.",
        failedGetBookById: "Hiba történt a könyv id alapján történő lekérésekor.",
        failedCreateBook: "Hiba történt a könyv készítésekor.",
        failedUpdateBook: "Hiba történt a könyv módosításakor.",
        failedDeleteBook: "Hiba történt a könyvértékelés törlésekor.",

        // book_rate
        notHaveBookRate: "Nincs könyvértékelésed ezzel az azonosítóval.",
        notContainBookRate: "Ez a könyv nem tartalmaz könyvértékelést ezzel az azonosítóval.",
        alreadyRatedBook: "Már értékelted ezt a könyvet.",
        failedGetBookRates: "Hiba történt a könyvértékelések lekérésekor.",
        failedCreateBookRate: "Hiba történt a könyvértékelés készítésekor.",
        failedUpdateBookRate: "Hiba történt a könyvértékelés módosításakor.",
        failedDeleteBookRate: "Hiba történt a könyvértékelés törlésekor.",

        // message
        failedGetMessages: "Hiba történt az üzenetek lekérésekor.",
        failedGetMessagesByUserId: "Hiba történt az üzenet tartalmának lekérésekor.",
        failedCreateMessage: "Hiba történt az üzenet létrehozásakor.",
        failedUpdateMessageSeen: "Hiba történt az üzenet 'láttam' módosításakor.",
        failedDeleteMessage: "Hiba történt az üzenet id alapján történő törlésekor.",
        failedGetMessageContent: "Hiba történt az üzenet tartalmának id alapján történő lekérésekor.",
        failedDeleteMessageContent: "Hiba történt az üzenet tartalmának id alapján történő törlésekor.",

        // borrow
        failedGetBorrows: "Hiba történt a kölcsönzések lekérésekor",
        failedGetBorrowById: "Hiba történt a kölcsönzés id alapján történő lekérésekor.",
        booksAreForLend: "Ezek a könyvek kölcsönkérés miatt lettek feltöltve.",
        borrowFromYourself: "Nem kölcsönözhetsz magadtól könyveket.",
        failedCreateBorrow: "Hiba történt a kölcsönzés létrehozásakor.",
        cannotModifyBorrow: "Nem módosíthatod ezt a kölcsönzést.",
        cannotBorrowBook: "Ez a könyv nem emiatt lett feltöltve.",
        failedUpdateBorrow: "Hiba történt a kölcsönzés módosításakor.",
        failedDeleteBorrow: "Hiba történt a kölcsönzés törlésekor.",
        cannotModifyVerified: "Nem módosíthatod a 'visszaigazolva' mezőt.",
        cannotDeleteBorrow: "Nem törölheted ezt a kölcsönzést.",

        // lend
        booksAreForBorrow: "Ezek a könyvek kölcsönadás miatt lettek feltölve.",
        lendToYourself: "Nem adhatsz kölcsön magadnak könyveket.",

        // user
        failedCreateUser: "Hiba történt a felhasználói fiók létrehozásakor.",
        failedUpdateUser: "Hiba történt a felhasználó módosításakor.",
        failedUpdateUsers: "Hiba történt a felhasználók módosításakor.",
        failedUpdateYourUser: "Hiba történt a profilod módosításakor.",
        failedDeleteYourUser: "Hiba történt a profilod törlésekor.",
        failedDeleteUser: "Hiba történt a felhasználó törlésekor.",

        // user_rate
        failedGetUserRates: "Hiba történt a felhasználói értékelések lekérésekor.",
        failedGetUserRateById: "Hiba történt a felhasználói értékelés id alapján történő lekérésekor.",
        failedGetUserRateByUserId: "Hiba történt a felhasználói értékelés felhasználói id alapján történő lekérésekor.",
        failedGetUserRateByBorrowId: "Hiba történt a felhasználói értékelés kölcsönzés id alapján történő lekérésekor.",
        notHaveUserRateById: "You do not have user rate by this id.",
        cannotIfBorrowNotVerified: "You can not rate user if borrow is not verified.",
        failedUpdateUserRate: "Hiba történt a felhasználói értékelés módosításakor.",
        failedCreateUserRate: "Hiba történt a felhasználói értékelés létrehozásakor.",
        failedDeleteUserRate: "Hiba történt a felhasználói értékelés törlésekor.",

        // notification
        failedGetNotifications: "Hiba történt az értesítések lekérésekor.",
        failedGetNotificationById: "Hiba történt az értesítés id alapján történő lekérésekor.",
        failedCreateNotification: "Hiba történt az értesítés létrehozásakor.",
        failedUpdateNotificationSeen: "Hiba történt az értesítés 'láttam' mező módosításakor.",
        failedDeleteNotificationById: "Hiba történt az értesítés id alapján történő örlésekor.",
    },
    email: {
        passwordSubject: "Jelszó módosítása",
        passwordBody:
            "<div>Hello,</div><br /><div>A jelszó módosításához tartozó: #link#.</div><br /><div>Köszönettel! A BookSwap csapata</div>",
        verifySubject: "E-mail hitelesítés",
        verifyBody:
            "<div>Hello,</div><br /><div>Regisztráltál egy fiókot a BookSwap-on, mielőtt használni tudnád, igazolnod kell, hogy ez a Te e-mail címed, ide kattintva: #link#.</div><br /><div>Köszönettel! A BookSwap csapata</div>",
    },
} as const;
