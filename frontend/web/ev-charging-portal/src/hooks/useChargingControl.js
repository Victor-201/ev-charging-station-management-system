// contexts/useChargingControl.js
import { useContext } from "react";
import { ChargingControlContext } from "@/context/ChargingControlContext";

export const useChargingControl = () => {
  const ctx = useContext(ChargingControlContext);
  if (!ctx) {
    throw new Error("useChargingControl must be used within a ChargingControlProvider");
  }
  return ctx;
};
