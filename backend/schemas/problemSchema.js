import { z } from "zod";

export const TestcaseSchema = z.object({
    input: z.record(z.any()),
    expectedOutput: z.any(),
});

export const ReturnTypeSchema = z.object({
    java: z.string().nullable().default(null),
    cpp: z.string().nullable().default(null),
}).default({});

export const MetaSchema = z.object({
    id: z.number().int().positive(),
    slug: z.string().min(1),
    title: z.string().min(1),
    difficulty: z.enum([
        "Easy",
        "Medium",
        "Hard",
    ]),
    topic: z.string().min(1),
    pattern: z.string().default(""),
    sourceType: z.string().default("core"),
    functionName: z.string().min(1),
    estimatedTime: z.string().default(""),
    companies: z.array(z.string()).default([]),
    relatedProblems: z.array(z.string()).default([]),
    // Optional per-language execution contract — see backend/models/Problem.js
    // returnTypeSchema. Absent for problems that don't need it (dynamically
    // typed languages, or statically-typed methods returning a type the
    // regex-inference fallback in generateDriverCode.js already handles).
    returnType: ReturnTypeSchema,
});

export const ProblemFolderSchema =
    z.object({
        meta: MetaSchema,
        description: z.string(),
        visibleTestcases: z.array(
            TestcaseSchema
        ),
        hiddenTestcases: z.array(
            TestcaseSchema
        ),
        starterCode: z.object({
            python: z.string(),
            javascript: z.string(),
            java: z.string(),
            cpp: z.string(),
        }),
        editorial: z.string().default(""),
        hints: z.array(
            z.object({
                level: z.number().int().positive(),
                text: z.string(),
            })
        ).default([]),
    });