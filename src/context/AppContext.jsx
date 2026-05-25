import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getStorageData,
  setStorageData,
} from "../services/storageService";

const AppContext =
  createContext();

export function AppProvider({
  children,
}) {

  // Global State
  const [
    solvedProblems,
    setSolvedProblems,
  ] = useState([]);

  const [
    submissions,
    setSubmissions,
  ] = useState([]);

  const [
    topicStats,
    setTopicStats,
  ] = useState({});

  // Initial Load
  useEffect(() => {

    setSolvedProblems(
      getStorageData(
        "codeclimbSolved",
        []
      )
    );

    setSubmissions(
      getStorageData(
        "allSubmissions",
        []
      )
    );

    setTopicStats(
      getStorageData(
        "topicStats",
        {}
      )
    );

  }, []);

  // Actions

  function addSolvedProblem(
    slug
  ) {

    // Prevent duplicates
    if (
      solvedProblems.includes(slug)
    ) {

      return;

    }

    const updatedSolved = [
      ...solvedProblems,
      slug,
    ];

    setSolvedProblems(
      updatedSolved
    );

    setStorageData(
      "codeclimbSolved",
      updatedSolved
    );

  }

  function addSubmission(
    submission
  ) {

    const updatedSubmissions = [
      submission,
      ...submissions,
    ];

    setSubmissions(
      updatedSubmissions
    );

    setStorageData(
      "allSubmissions",
      updatedSubmissions
    );

  }

  function updateTopicStats(
    topic
  ) {

    const updatedTopics = {
      ...topicStats,

      [topic]:
        (topicStats[topic] || 0) + 1,
    };

    setTopicStats(
      updatedTopics
    );

    setStorageData(
      "topicStats",
      updatedTopics
    );

  }

  return (

    <AppContext.Provider
      value={{

        // State
        solvedProblems,
        submissions,
        topicStats,

        // Actions
        addSolvedProblem,
        addSubmission,
        updateTopicStats,

      }}
    >

      {children}

    </AppContext.Provider>

  );
}

export function useAppContext() {

  return useContext(AppContext);

}