import { useContext } from "react";
import { AppContext } from "../context/AppContextObject";

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppContextProvider");
  }

  return context;
}
