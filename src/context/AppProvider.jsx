import {
  useCallback,
  useState,
} from "react";

import { PROGRESS_KEYS } from "../constants/progressKeys";
import {
  getStorageData,
  setStorageData,
} from "../services/storageService";
import {
  markProblemSolvedInProgress,
  persistProgress,
  progressFromLocalStorage,
  recordSubmission,
} from "../services/progressService";
import { AppContext } from "./appContext";

function loadInitialState() {
  const progress = progressFromLocalStorage();

  return {
    solvedProblems: progress.solvedSlugs,
    topicStats: progress.topicStats,
    activityDates: progress.activityDates,
    solvedDifficulty: progress.solvedDifficulty,
    recentActivity: progress.recentActivity,
    submissions: getStorageData(
      PROGRESS_KEYS.submissions,
      []
    ),
  };
}

export function AppProvider({
  children,
}) {
  const [state, setState] = useState(loadInitialState);

  const hydrateFromServer = useCallback(
    (progress, submissions = null) => {
      const nextSubmissions =
        submissions ??
        getStorageData(
          PROGRESS_KEYS.submissions,
          []
        );

      setState({
        solvedProblems:
          progress.solvedSlugs || [],
        topicStats:
          progress.topicStats || {},
        activityDates:
          progress.activityDates || [],
        solvedDifficulty:
          progress.solvedDifficulty || {
            easy: 0,
            medium: 0,
            hard: 0,
          },
        recentActivity:
          progress.recentActivity || [],
        submissions: nextSubmissions,
      });

      setStorageData(
        PROGRESS_KEYS.solved,
        progress.solvedSlugs || []
      );
      setStorageData(
        PROGRESS_KEYS.topicStats,
        progress.topicStats || {}
      );
      setStorageData(
        PROGRESS_KEYS.activityDates,
        progress.activityDates || []
      );
      setStorageData(
        PROGRESS_KEYS.solvedDifficulty,
        progress.solvedDifficulty || {
          easy: 0,
          medium: 0,
          hard: 0,
        }
      );
      setStorageData(
        PROGRESS_KEYS.recentActivity,
        progress.recentActivity || []
      );
      setStorageData(
        PROGRESS_KEYS.submissions,
        nextSubmissions
      );
    },
    []
  );

  const markProblemSolved = useCallback(
    async ({
      slug,
      topic,
      difficulty,
      title,
    }) => {
      setState((prev) => {
        const updated = markProblemSolvedInProgress(
          {
            solvedSlugs: prev.solvedProblems,
            topicStats: prev.topicStats,
            activityDates: prev.activityDates,
            solvedDifficulty:
              prev.solvedDifficulty,
            recentActivity:
              prev.recentActivity,
            leetcodeUsername:
              localStorage.getItem(
                PROGRESS_KEYS.leetcodeUsername
              ) || "",
          },
          { slug, topic, difficulty, title }
        );

        persistProgress(updated);

        return {
          ...prev,
          solvedProblems: updated.solvedSlugs,
          topicStats: updated.topicStats,
          activityDates: updated.activityDates,
          solvedDifficulty:
            updated.solvedDifficulty,
          recentActivity:
            updated.recentActivity,
        };
      });
    },
    []
  );

  const addSubmission = useCallback(
    async (submission) => {
      const updated = await recordSubmission(
        submission
      );

      setState((prev) => ({
        ...prev,
        submissions: updated,
      }));
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        hydrateFromServer,
        addSubmission,
        markProblemSolved,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
