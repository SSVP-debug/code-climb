import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { AuthProvider } from "./context/authContext";

import AppContextProvider from "./context/appContext";

import "./index.css";

import { Toaster } from "react-hot-toast";

// Inside your render, right after <AuthProvider>:
<AuthProvider>
  <AppContextProvider>
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#18181b",
          color: "#ffffff",
          border: "1px solid #3f3f46",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#22c55e", secondary: "#000" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
      }}
    />
    <App />
  </AppContextProvider>
</AuthProvider>

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

