import { useContext } from "react";
import { AppContext } from "../context/appContext";

export function useAppContext() {
  return useContext(AppContext);
}
