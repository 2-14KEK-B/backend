import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import type { Book } from "@interfaces/book";
import type { BookRate } from "@interfaces/bookRate";

enum genres {
    "fantasy",
    "scifi",
    "dystopian",
    "adventure",
    "romance",
    "detectiveAndMystery",
    "horror",
    "thriller",
    "lgbtq",
    "historyFiction",
    "youngAdult",
    "childrenFiction",
    "memoirAndAutobiography",
    "biography",
    "cooking",
    "artAndPhotography",
    "selfHelpPersonalDevelopment",
    "motivationalInspirational",
    "healthAndFitness",
    "history",
    "craftsHobbiesHome",
    "familiesAndRelationships",
    "humorAndEntertainment",
    "businessAndMoney",
    "lawAndCriminology",
    "politicsAndSocialSciences",
    "religionAndSpirituality",
    "educationAndTeaching",
    "travel",
    "trueCrime",
}

const bookrateSchema = new Schema<BookRate>(
    {
        from: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        comment: {
            type: String,
            maxlength: [256, "bookRate.commentMaxLength"],
        },
        rate: {
            type: Number,
            required: true,
            min: [1, "bookRate.rateMin"],
            max: [5, "bookrate.rateMax"],
        },
    },
    { timestamps: true, versionKey: false },
);

const bookSchema = new Schema<Book>(
    {
        uploader: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "book.uploaderRequired"],
        },
        isbn: { type: String },
        author: {
            type: String,
            required: [true, "book.authorRequired"],
            minlength: [4, "book.authorShort"],
            maxlength: [64, "book.authorLong"],
        },
        title: {
            type: String,
            required: [true, "book.titleRequired"],
            minlength: [1, "book.titleShort"],
            maxlength: [128, "book.titleLong"],
        },
        picture: { type: String, trim: true },
        category: [
            {
                type: String,
                enum: [genres, "book.onlyFromGenres"],
                required: [true, "book.genreRequired"],
            },
        ],
        price: {
            type: Number,
            default: 0,
            min: [0, "book.minPrice"],
            max: [1000000, "book.maxPrice"],
        },
        available: {
            type: Boolean,
            default: true,
        },
        for_borrow: {
            type: Boolean,
            required: [true, "book.forBorrowRequired"],
        },
        rates: [bookrateSchema],
    },
    { timestamps: true },
);

bookSchema.path("isbn").validate((val: string) => {
    // Checks for ISBN-10 or ISBN-13 format
    const regex = new RegExp(
        /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/,
    );

    if (regex.test(val)) {
        // Remove non ISBN digits, then split into an array
        const chars = val.replace(/[- ]|^ISBN(?:-1[03])?:?/g, "").split("");
        // Remove the final ISBN digit from `chars`, and assign it to `last`
        const last = chars.pop();
        let sum = 0;
        let check, i;

        if (chars.length == 9) {
            // Compute the ISBN-10 check digit
            chars.reverse();
            for (i = 0; i < chars.length; i++) {
                if (typeof chars[i] == "string") {
                    sum += (i + 2) * parseInt(chars[i] as string, 10);
                }
            }
            check = 11 - (sum % 11);
            if (check == 10) {
                check = "X";
            } else if (check == 11) {
                check = "0";
            }
        } else {
            // Compute the ISBN-13 check digit
            for (i = 0; i < chars.length; i++) {
                if (typeof chars[i] == "string") {
                    sum += ((i % 2) * 2 + 1) * parseInt(chars[i] as string, 10);
                }
            }
            check = 10 - (sum % 10);
            if (check == 10) {
                check = "0";
            }
        }
        return check == last;
    } else {
        return false;
    }
}, "book.invalidIsbn");

bookSchema.path("picture").validate((val: string) => {
    const imgUrlRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/;
    return imgUrlRegex.test(val);
}, "picture.invalidUrl");

bookSchema.plugin(paginate);

export default bookSchema;
