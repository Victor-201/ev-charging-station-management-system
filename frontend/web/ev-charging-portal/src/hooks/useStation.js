import { useContext } from "react";
import { StationContext } from "@/context/StationContext";

export const useStation = () => {
  const ctx = useContext(StationContext);
  if (!ctx) {
    throw new Error("useStation must be used within a StationProvider");
  }
  return ctx;
};
