// contexts/useAnalytics.js
import { useContext } from "react";
import { AnalyticsContext } from "@/contexts/AnalyticsContext";

export const useAnalytics = () => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return ctx;
};
