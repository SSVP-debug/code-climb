import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ProblemCard from "../components/ProblemCard";
import problems from "../data/problems";

function ProblemsPage() {

    const [selectedDifficulty, setSelectedDifficulty] =
        useState("All");
    const [searchTerm, setSearchTerm] =
        useState("");

    const [selectedTopic, setSelectedTopic] =
        useState("All");

    return (
        <DashboardLayout>

            <div className="p-8">

                {/* Header */}
                <div className="mb-8">

                    <input
                        type="text"
                        placeholder="Search problems..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                        className="w-full md:w-[400px] bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-xl outline-none focus:border-green-500 transition"
                    />

                </div>
                <div className="mb-8">

                    <h1 className="text-4xl font-bold">
                        Problems
                    </h1>

                    <p className="text-zinc-400 mt-2">
                        Sharpen your DSA skills and climb consistently.
                    </p>

                </div>

                {/* Difficulty Filters */}
                <div className="flex gap-4 mb-8 flex-wrap">

                    {[
                        "All",
                        "Arrays",
                        "Trees",
                        "Graphs",
                    ].map((topic) => (

                        <button
                            key={topic}
                            onClick={() =>
                                setSelectedTopic(topic)
                            }
                            className={`px-5 py-2 rounded-xl transition font-semibold ${selectedTopic === topic
                                ? "bg-blue-500 text-white"
                                : "bg-zinc-900 border border-zinc-800 text-white hover:border-blue-500"
                                }`}
                        >
                            {topic}
                        </button>

                    ))}

                </div>
                <div className="flex gap-4 mb-8 flex-wrap">

                    {[
                        "All",
                        "Easy",
                        "Medium",
                        "Hard",
                    ].map((level) => (

                        <button
                            key={level}
                            onClick={() =>
                                setSelectedDifficulty(level)
                            }
                            className={`px-5 py-2 rounded-xl transition font-semibold ${selectedDifficulty === level
                                ? "bg-green-500 text-black"
                                : "bg-zinc-900 border border-zinc-800 text-white hover:border-green-500"
                                }`}
                        >
                            {level}
                        </button>

                    ))}

                </div>

                {/* Problems Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {problems
                        .filter((problem) => {

                            const matchesDifficulty =
                                selectedDifficulty === "All" ||
                                problem.difficulty ===
                                selectedDifficulty;

                            const matchesTopic =
                                selectedTopic === "All" ||
                                problem.topic === selectedTopic;

                            const matchesSearch =
                                problem.title
                                    .toLowerCase()
                                    .includes(
                                        searchTerm.toLowerCase()
                                    );

                            return (
                                matchesDifficulty &&
                                matchesTopic &&
                                matchesSearch
                            );

                        })

                        .map((problem) => (

                    <ProblemCard
                        key={problem.id}
                        title={problem.title}
                        slug={problem.slug}
                        difficulty={problem.difficulty}
                        topic={problem.topic}
                    />

                        ))}

                </div>

            </div>

        </DashboardLayout>
    );
}

export default ProblemsPage;