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
import { PaymentProvider } from "@/providers/PaymentProvider"; // ✅ thêm dòng này

console.log("🚀 Rendering App...");

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* StationProvider phải nằm ngoài để ChargingControlProvider có thể dùng StationContext */}
          <StationProvider>
            <ChargingControlProvider>
              {/* ✅ Thêm PaymentProvider vào đây */}
              <PaymentProvider>
                <App />
              </PaymentProvider>
            </ChargingControlProvider>
          </StationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
