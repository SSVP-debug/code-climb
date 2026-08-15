import { useContext } from "react";
import { PremiumContext } from "../context/PremiumContextObject";

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error("usePremium() must be used within a PremiumProvider");
  }
  return ctx;
}
