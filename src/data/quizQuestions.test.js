import { describe, expect, it } from "vitest";
import quizQuestions, { QUIZ_TOPICS } from "./quizQuestions";

describe("quizQuestions data integrity", () => {
  it("has at least one question", () => {
    expect(quizQuestions.length).toBeGreaterThan(0);
  });

  it("gives every question exactly 4 options", () => {
    for (const question of quizQuestions) {
      expect(question.options).toHaveLength(4);
    }
  });

  it("keeps correctIndex within [0,3] for every question", () => {
    for (const question of quizQuestions) {
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThanOrEqual(3);
    }
  });

  it("has no duplicate option text within a single question", () => {
    for (const question of quizQuestions) {
      const uniqueOptions = new Set(question.options);
      expect(uniqueOptions.size).toBe(question.options.length);
    }
  });

  it("assigns every question a topic that exists in QUIZ_TOPICS", () => {
    for (const question of quizQuestions) {
      expect(QUIZ_TOPICS).toContain(question.topic);
    }
  });

  it("gives every topic in QUIZ_TOPICS at least 8 questions", () => {
    const countByTopic = new Map(QUIZ_TOPICS.map((topic) => [topic, 0]));

    for (const question of quizQuestions) {
      countByTopic.set(question.topic, (countByTopic.get(question.topic) ?? 0) + 1);
    }

    for (const topic of QUIZ_TOPICS) {
      expect(countByTopic.get(topic)).toBeGreaterThanOrEqual(8);
    }
  });

  it("has no duplicate id values across the whole bank", () => {
    const ids = quizQuestions.map((question) => question.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});