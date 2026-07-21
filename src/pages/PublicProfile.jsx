import { useEffect, useState } from "react";
import PageMeta from "../components/seo/PageMeta";
import { useParams } from "react-router-dom";
import ActivityHeatmap
    from "../components/profile/ActivityHeatmap";
import SkillRadar
    from "../components/profile/SkillRadar";
import CodingDNA
    from "../components/profile/CodingDNA";
import AchievementGallery
    from "../components/dashboard/sections/AchievementGallery";
import SectionCard
    from "../components/ui/layout/SectionCard";
import { getLevelProgress } from "../utils/xpLevel";
import { SITE_URL } from "../config/site.js";
import LinkedInShareButton from "../components/common/LinkedInShareButton";
import { Pin } from "lucide-react";

function PublicProfile() {
    const { username } = useParams();

    const [profile, setProfile] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/public/u/${username}`
                );

                if (!response.ok) {
                    throw new Error(
                        "Profile not found"
                    );
                }

                const data =
                    await response.json();

                setProfile(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-10">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
        <PageMeta
            title={`${profile.displayName || profile.username} · Code Club Profile`}
            description={`Level ${profile.level} · ${profile.solvedCount} problems solved · ${profile.currentStreak} day streak on Code Club.`}
            path={`/u/${profile.username}`}
        />
        <div className="max-w-4xl mx-auto p-8">

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

                {/* Header */}

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-4xl font-bold">
                                {profile.displayName}
                            </h1>
                            {profile.recruiterSnapshot?.availableForWork && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    Available for opportunities
                                </span>
                            )}
                        </div>

                        <p className="text-zinc-400 mt-2">
                            @{profile.username}
                        </p>

                        {(profile.recruiterSnapshot?.preferredRole || profile.recruiterSnapshot?.expectedGraduation) && (
                            <p className="text-zinc-500 text-sm mt-1">
                                {[
                                    profile.recruiterSnapshot?.preferredRole,
                                    profile.recruiterSnapshot?.expectedGraduation && `Graduating ${profile.recruiterSnapshot.expectedGraduation}`,
                                ].filter(Boolean).join(" · ")}
                            </p>
                        )}
                    </div>

                    <LinkedInShareButton
                        url={`${SITE_URL}/u/${profile.username}`}
                    />
                </div>

                {/* Hero — Level / rank / XP progress, matching Profile.jsx's treatment */}

                <div className="mt-8">
                    {(() => {
                        const rank =
                            profile.level < 5 ? "Beginner" :
                                profile.level < 15 ? "Learner" :
                                    profile.level < 30 ? "Intermediate" :
                                        profile.level < 60 ? "Advanced" : "Expert";
                        const { current, needed, percent } = getLevelProgress(profile.totalXP);

                        return (
                            <>
                                <div className="flex items-baseline justify-between mb-1.5">
                                    <span className="text-lg font-semibold text-white">
                                        Level {profile.level} · {rank}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        {current.toLocaleString()} / {needed.toLocaleString()} XP to next level
                                    </span>
                                </div>
                                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(percent, 100)}%`,
                                            backgroundColor: "var(--theme-primary, #2dd4bf)",
                                        }}
                                    />
                                </div>
                            </>
                        );
                    })()}

                    <div className="grid grid-cols-3 gap-4 mt-6">

                        <div className="bg-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold">
                                {profile.totalXP}
                            </p>
                            <p className="text-zinc-400 text-xs mt-0.5">
                                Total XP
                            </p>
                        </div>

                        <div className="bg-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold">
                                {profile.solvedCount}
                            </p>
                            <p className="text-zinc-400 text-xs mt-0.5">
                                Solved
                            </p>
                        </div>

                        <div className="bg-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold">
                                {profile.currentStreak}
                            </p>
                            <p className="text-zinc-400 text-xs mt-0.5">
                                Current Streak
                            </p>
                        </div>

                    </div>

                </div>

                {/* Additional Info */}

                <div className="mt-8">

                    <p className="text-zinc-400">
                        Longest Streak
                    </p>

                    <p className="text-xl font-semibold">
                        {profile.longestStreak}
                    </p>

                    <p className="text-zinc-400 mt-4">
                        Joined
                    </p>

                    <p>
                        {new Date(
                            profile.joinedDate
                        ).toLocaleDateString()}
                    </p>

                </div>

                {/* Achievements */}

                <div className="mt-10">
                    <AchievementGallery achievements={profile.achievements || []} showLocked={false} />
                </div>

                {/* Difficulty Breakdown */}

                <div className="mt-10">

                    <h2 className="text-2xl font-bold mb-4">
                        Difficulty Breakdown
                    </h2>

                    <div className="grid grid-cols-3 gap-4">

                        <div className="bg-zinc-800 rounded-xl p-4">
                            <p className="text-zinc-400">
                                Easy
                            </p>

                            <p className="text-2xl font-bold">
                                {profile.solvedDifficulty?.easy || 0}
                            </p>
                        </div>

                        <div className="bg-zinc-800 rounded-xl p-4">
                            <p className="text-zinc-400">
                                Medium
                            </p>

                            <p className="text-2xl font-bold">
                                {profile.solvedDifficulty?.medium || 0}
                            </p>
                        </div>

                        <div className="bg-zinc-800 rounded-xl p-4">
                            <p className="text-zinc-400">
                                Hard
                            </p>

                            <p className="text-2xl font-bold">
                                {profile.solvedDifficulty?.hard || 0}
                            </p>
                        </div>

                    </div>

                </div>

                {/* Coding DNA */}

                <div className="mt-10">
                    <CodingDNA
                        submissions={[]}
                        topicStats={profile.topicStats || {}}
                        solvedDifficulty={profile.solvedDifficulty || {}}
                        longestStreak={profile.longestStreak || 0}
                        languageBreakdown={profile.languageBreakdown || []}
                    />
                </div>

                {/* Topic Coverage */}

                <div className="mt-10">

                    <h2 className="text-2xl font-bold mb-4">
                        Topic Coverage
                    </h2>


                    {/* ── Language Breakdown ────────────────────────────────────── */}
                    {profile.languageBreakdown && profile.languageBreakdown.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                                Languages
                            </h3>
                            <div className="space-y-3">
                                {profile.languageBreakdown.map((item) => {
                                    const total = profile.solvedCount || 1;
                                    const pct = Math.round((item.solved / total) * 100);
                                    const LANG_LABELS = { python: "Python", javascript: "JavaScript", java: "Java", cpp: "C++" };
                                    return (
                                        <div key={item.language}>
                                            <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                                <span className="font-medium text-white">{LANG_LABELS[item.language] ?? item.language}</span>
                                                <span>{item.solved} solved</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-teal-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Pinned Problems ───────────────────────────────────────── */}
                    {profile.pinnedProblems && profile.pinnedProblems.length > 0 && (
                        <SectionCard title="Pinned Problems" icon={<Pin size={18} strokeWidth={2} />} accented className="mb-6">
                            <div className="space-y-2">
                                {profile.pinnedProblems.map((p) => (
                                    <div key={p.slug} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                                        <span className="text-sm text-zinc-300">{p.title}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.difficulty === "Easy" ? "bg-green-500/10 text-green-400" :
                                            p.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-400" :
                                                "bg-red-500/10 text-red-400"
                                            }`}>
                                            {p.difficulty}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* ── Recent Solves ─────────────────────────────────────────── */}
                    {profile.recentSolves && profile.recentSolves.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                                Recent Solves
                            </h3>
                            <div className="space-y-2">
                                {profile.recentSolves.map((solve, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                                        <span className="text-sm text-zinc-300">{solve.title}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${solve.difficulty === "Easy" ? "bg-green-500/10 text-green-400" :
                                            solve.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-400" :
                                                "bg-red-500/10 text-red-400"
                                            }`}>
                                            {solve.difficulty}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <SkillRadar topicStats={profile.topicStats || {}} />

                </div>

                {profile.leetcode && (
                    <div className="mt-10">
                        <h2 className="text-2xl font-bold mb-4">
                            LeetCode
                        </h2>

                        <div className="bg-zinc-800 rounded-2xl p-6 space-y-5">

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm">
                                        Username
                                    </p>

                                    <p className="text-xl font-semibold">
                                        @{profile.leetcode.username}
                                    </p>
                                </div>

                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${profile.leetcode.source === "api"
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-yellow-500/10 text-yellow-400"
                                        }`}
                                >
                                    {profile.leetcode.source === "api"
                                        ? "Synced"
                                        : "Self Reported"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                <div>
                                    <p className="text-zinc-400 text-sm">
                                        Total
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {profile.leetcode.totalSolved}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-green-400 text-sm">
                                        Easy
                                    </p>

                                    <p className="text-xl font-bold">
                                        {profile.leetcode.easySolved}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-yellow-400 text-sm">
                                        Medium
                                    </p>

                                    <p className="text-xl font-bold">
                                        {profile.leetcode.mediumSolved}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-red-400 text-sm">
                                        Hard
                                    </p>

                                    <p className="text-xl font-bold">
                                        {profile.leetcode.hardSolved}
                                    </p>
                                </div>

                            </div>

                            {profile.leetcode.lastSyncedAt && (
                                <p className="text-xs text-zinc-500">
                                    Last synced{" "}
                                    {new Date(
                                        profile.leetcode.lastSyncedAt
                                    ).toLocaleDateString()}
                                </p>
                            )}

                        </div>
                    </div>
                )}

                <ActivityHeatmap
                    activityDates={
                        profile.activityDates
                    }
                />

            </div>

        </div>
        </div>
    );
}

export default PublicProfile;