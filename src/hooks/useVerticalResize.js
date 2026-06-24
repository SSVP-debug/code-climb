import { useEffect, useState } from "react";

const STORAGE_KEY = "workspace.editorHeight";

export function useVerticalResize() {
  const [editorHeight, setEditorHeight] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 380;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, editorHeight);
  }, [editorHeight]);

  return {
    editorHeight,
    setEditorHeight,
  };
}