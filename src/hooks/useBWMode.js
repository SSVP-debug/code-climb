import { useContext } from "react";
import { BWModeContext } from "../context/BWModeContextObject";

export function useBWMode() {
  const context = useContext(BWModeContext);

  if (!context) {
    throw new Error("useBWMode must be used inside BWModeProvider");
  }

  return context;
}
