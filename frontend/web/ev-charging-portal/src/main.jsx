// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import "@/index.css";

import { AuthProvider } from "@/providers/AuthProvider.jsx";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { StationProvider } from "@/providers/StationProvider";
import { ChargingControlProvider } from "@/providers/ChargingControlProvider";
import { PaymentProvider } from "@/providers/PaymentProvider"; 
import UserProvider from "@/providers/UserProvider"; 
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";

console.log("🚀 Rendering App...");

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <AnalyticsProvider>
              <StationProvider>
                <ChargingControlProvider>
                  <PaymentProvider>
                    <App />
                  </PaymentProvider>
                </ChargingControlProvider>
              </StationProvider>
            </AnalyticsProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
