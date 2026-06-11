import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true,
        },

        topic: {
            type: String,
            required: true,
            trim: true,
        },

        pattern: {
            type: String,
            default: "",
        },

        sourceType: {
            type: String,
            enum: ["core", "variant", "original"],
            default: "core",
        },

        description: {
            type: String,
            default: "",
        },

        starterCode: {
            type: Object,
            default: {},
        },

        examples: {
            type: Array,
            default: [],
        },

        constraints: {
            type: Array,
            default: [],
        },

        visibleTestCases: {
            type: Array,
            default: [],
        },
        testcases: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Problem", problemSchema);