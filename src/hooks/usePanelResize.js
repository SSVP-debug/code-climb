import { useEffect, useState } from "react";

const STORAGE_KEY = "workspace.problemWidth";

export function usePanelResize() {
  const [problemWidth, setProblemWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 40;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, problemWidth);
  }, [problemWidth]);

  return {
    problemWidth,
    setProblemWidth,
  };
}