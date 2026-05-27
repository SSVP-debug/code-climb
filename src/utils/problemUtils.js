import { getStorageData } from "../services/storageService";
import { PROGRESS_KEYS } from "../constants/progressKeys";

export function isProblemSolved(slug) {
  const solvedProblems = getStorageData(
    PROGRESS_KEYS.solved,
    []
  );

  return solvedProblems.includes(slug);
}
