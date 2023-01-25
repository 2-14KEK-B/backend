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
        comment: String,
        rate: { type: Number, required: true },
    },
    { timestamps: true, versionKey: false },
);

const bookSchema = new Schema<Book>(
    {
        uploader: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        isbn: String,
        author: { type: String, required: true },
        title: { type: String, required: true },
        picture: { type: String },
        category: [{ type: String, enum: genres, required: true }],
        price: { type: Number, default: 0 },
        available: { type: Boolean, default: true },
        for_borrow: { type: Boolean, required: true },
        rates: [bookrateSchema],
    },
    { timestamps: true },
);

bookSchema.plugin(paginate);

export default bookSchema;
