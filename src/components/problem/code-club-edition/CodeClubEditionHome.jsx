import { useEffect, useState } from "react";
import { useCodeClubEdition } from "../../../hooks/useCodeClubEdition";
import ChapterHero from "./ChapterHero";
import ChapterCard from "./ChapterCard";
import ChapterDetail from "./ChapterDetail";

// Mirrors LearningPathsView.jsx's cc_activeView sessionStorage pattern —
// opening a mission navigates to the separate /problems/:slug route,
// which unmounts ProblemsPage (and this view) entirely. Persisting which
// chapter was open means a student who solves a mission and comes back
// lands back in that chapter, not the campaign map — see
// LearningPathsView.jsx's identical comment for the full rationale.
function readStoredChapterId() {
  try {
    return sessionStorage.getItem("cc_editionChapterId") || null;
  } catch {
    return null;
  }
}

function CodeClubEditionHome({ problems, solvedProblems }) {
  const { chapters, campaignProgress } = useCodeClubEdition(problems, solvedProblems);
  const [selectedChapterId, setSelectedChapterId] = useState(readStoredChapterId);

  useEffect(() => {
    try {
      if (selectedChapterId) {
        sessionStorage.setItem("cc_editionChapterId", selectedChapterId);
      } else {
        sessionStorage.removeItem("cc_editionChapterId");
      }
    } catch {
      /* sessionStorage unavailable (private mode, etc.) — non-fatal */
    }
  }, [selectedChapterId]);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? null;

  function handleContinue() {
    const targetChapterId = campaignProgress.continueTarget?.chapterId ?? campaignProgress.currentChapterId;
    if (targetChapterId) setSelectedChapterId(targetChapterId);
  }

  if (selectedChapter) {
    const nextChapter =
      chapters.find((c) => c.chapterNumber === selectedChapter.chapterNumber + 1) ?? null;

    return (
      <ChapterDetail
        chapter={selectedChapter}
        nextChapter={nextChapter}
        onBack={() => setSelectedChapterId(null)}
      />
    );
  }

  const currentChapter = chapters.find((c) => c.id === campaignProgress.currentChapterId) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <ChapterHero
        campaignProgress={campaignProgress}
        currentChapter={currentChapter}
        onContinue={handleContinue}
      />

      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Chapters</h2>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
          Clear each chapter's missions in order to unlock the next.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {chapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} onOpen={setSelectedChapterId} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CodeClubEditionHome;