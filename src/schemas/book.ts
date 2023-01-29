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
        comment: { type: String, maxlength: 256 },
        rate: { type: Number, required: true, min: 1, max: 5 },
    },
    { timestamps: true, versionKey: false },
);

const bookSchema = new Schema<Book>(
    {
        uploader: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isbn: { type: String },
        author: { type: String, required: true, minlength: 4, maxlength: 64 },
        title: { type: String, required: true, minlength: 1, maxlength: 128 },
        picture: { type: String, trim: true },
        category: [{ type: String, enum: genres, required: true }],
        price: { type: Number, default: 0, min: 0, max: 1000000 },
        available: { type: Boolean, default: true },
        for_borrow: { type: Boolean, required: true },
        rates: [bookrateSchema],
    },
    { timestamps: true },
);

bookSchema.path("isbn").validate(val => {
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
                sum += (i + 2) * parseInt(chars[i], 10);
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
                sum += ((i % 2) * 2 + 1) * parseInt(chars[i], 10);
            }
            check = 10 - (sum % 10);
            if (check == 10) {
                check = "0";
            }
        }
        return check == last;
    }
}, "Invalid ISBN");

bookSchema.path("picture").validate(val => {
    const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
    return urlRegex.test(val);
}, "Invalid URL.");

bookSchema.plugin(paginate);

export default bookSchema;
