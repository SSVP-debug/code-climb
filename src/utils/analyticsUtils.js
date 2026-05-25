import problems
    from "../data/problems";
import {
    getStorageData,
} from "../services/storageService";

export function getDailyChallenge() {

    const today =
        new Date()
            .toLocaleDateString();

    const seed =
        today
            .split("/")
            .join("");

    const index =
        Number(seed) %
        problems.length;

    return problems[index];

}
export function getAllSubmissions() {

    return (
        getStorageData(
            "allSubmissions",
            []
        )
    );

}

export function getSolvedProblems() {

    return (
        JSON.parse(
            localStorage.getItem(
                "codeclimbSolved"
            )
        ) || []
    );

}

export function getAcceptanceRate() {

    const submissions =
        getAllSubmissions();

    if (submissions.length === 0) {

        return 0;

    }

    const accepted =
        submissions.filter(
            (submission) =>
                submission.status ===
                "Accepted 🎉"
        ).length;

    return (
        (
            accepted /
            submissions.length
        ) * 100
    ).toFixed(1);

}

export function getAverageRuntime() {

    const submissions =
        getAllSubmissions();

    const acceptedSubmissions =
        submissions.filter(
            (submission) =>
                submission.status ===
                "Accepted 🎉"
        );

    if (
        acceptedSubmissions.length === 0
    ) {

        return 0;

    }

    const totalRuntime =
        acceptedSubmissions.reduce(
            (sum, submission) => {

                return (
                    sum +
                    Number(
                        submission.executionTime || 0
                    )
                );

            },
            0
        );

    return (
        totalRuntime /
        acceptedSubmissions.length
    ).toFixed(2);

}

export function getLanguageStats() {

    const submissions =
        getAllSubmissions();

    const stats = {};

    submissions.forEach(
        (submission) => {

            const language =
                submission.language;

            stats[language] =
                (stats[language] || 0) + 1;

        }
    );

    return stats;

}
export function getTopicStats() {

    return (
        JSON.parse(
            localStorage.getItem(
                "topicStats"
            )
        ) || {}
    );

}
export function getWeakestTopic() {

    const topicStats =
        JSON.parse(
            localStorage.getItem(
                "topicStats"
            )
        ) || {};

    const topics =
        Object.entries(topicStats);

    if (topics.length === 0) {

        return "N/A";

    }

    topics.sort(
        (a, b) => a[1] - b[1]
    );

    return topics[0][0];

}
export function getStrongestTopic() {

    const topicStats =
        JSON.parse(
            localStorage.getItem(
                "topicStats"
            )
        ) || {};

    const topics =
        Object.entries(topicStats);

    if (topics.length === 0) {

        return "N/A";

    }

    topics.sort(
        (a, b) => b[1] - a[1]
    );

    return topics[0][0];

}
export function getAchievements() {

    const solvedProblems =
        JSON.parse(
            localStorage.getItem(
                "codeclimbSolved"
            )
        ) || [];

    const submissions =
        JSON.parse(
            localStorage.getItem(
                "allSubmissions"
            )
        ) || [];

    const achievements = [];

    // First Solve
    if (solvedProblems.length >= 1) {

        achievements.push({
            title: "First Blood",
            description:
                "Solved your first problem.",
        });

    }

    // 5 Solves
    if (solvedProblems.length >= 5) {

        achievements.push({
            title: "Consistency Begins",
            description:
                "Solved 5 problems.",
        });

    }

    // 25 Solves
    if (solvedProblems.length >= 25) {

        achievements.push({
            title: "Problem Crusher",
            description:
                "Solved 25 problems.",
        });

    }

    // 50 Solves
    if (solvedProblems.length >= 50) {

        achievements.push({
            title: "DSA Warrior",
            description:
                "Solved 50 problems.",
        });

    }

    // Fast Runtime
    const fastSubmission =
        submissions.find(
            (submission) =>
                Number(
                    submission.executionTime
                ) < 100
        );

    if (fastSubmission) {

        achievements.push({
            title: "Speed Demon",
            description:
                "Achieved runtime under 100ms.",
        });

    }

    return achievements;

}
export function getProfileData() {

    const solvedProblems =
        JSON.parse(
            localStorage.getItem(
                "codeclimbSolved"
            )
        ) || [];

    const submissions =
        JSON.parse(
            localStorage.getItem(
                "allSubmissions"
            )
        ) || [];

    const topicStats =
        JSON.parse(
            localStorage.getItem(
                "topicStats"
            )
        ) || {};

    return {

        totalSolved:
            solvedProblems.length,

        totalSubmissions:
            submissions.length,

        topicsSolved:
            Object.keys(topicStats).length,

        joinedDate:
            localStorage.getItem(
                "joinedDate"
            ) || "Today",

    };

}