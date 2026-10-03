import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ToastProvider from "./components/ui/ToastProvider.jsx";
import ThemeProvider from "./context/ThemeProvider.jsx";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/redesign.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <AuthProvider>
          <ToastProvider><App /></ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
