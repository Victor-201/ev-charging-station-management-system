// contexts/usePayment.js
import { useContext } from "react";
import { PaymentContext } from "@/contexts/PaymentContext";

export const usePayment = () => {
  const ctx = useContext(PaymentContext);
  if (!ctx) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return ctx;
};
