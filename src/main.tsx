import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ModeProvider } from "./context/ModeContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ModeProvider>
          <AppWrapper>
            <App />
          </AppWrapper>
        </ModeProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
