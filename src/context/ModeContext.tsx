import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AppMode, PendingMode } from "../types/auth";

type ModeContextValue = {
  mode: AppMode;
  pendingMode: PendingMode;
  chooserOpen: boolean;
  hasSelectedMode: boolean;
  openChooser: () => void;
  closeChooser: () => void;
  setMode: (mode: AppMode) => void;
  setPendingMode: (mode: PendingMode) => void;
};

const MODE_STORAGE_KEY = "novametrics-app-mode";
const PENDING_MODE_STORAGE_KEY = "novametrics-app-pending-mode";

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

function readStoredMode(): AppMode {
  if (typeof window === "undefined") {
    return "unselected";
  }

  const value = window.localStorage.getItem(MODE_STORAGE_KEY);
  if (value === "demo" || value === "real") {
    return value;
  }

  return "unselected";
}

function readPendingMode(): PendingMode {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(PENDING_MODE_STORAGE_KEY);
  return value === "real" ? "real" : null;
}

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => readStoredMode());
  const [pendingMode, setPendingModeState] = useState<PendingMode>(() =>
    readPendingMode(),
  );
  const [chooserOpen, setChooserOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (mode === "unselected") {
      window.localStorage.removeItem(MODE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (pendingMode === "real") {
      window.sessionStorage.setItem(PENDING_MODE_STORAGE_KEY, pendingMode);
      return;
    }

    window.sessionStorage.removeItem(PENDING_MODE_STORAGE_KEY);
  }, [pendingMode]);

  const value = useMemo<ModeContextValue>(
    () => ({
      mode,
      pendingMode,
      chooserOpen,
      hasSelectedMode: mode !== "unselected",
      openChooser: () => setChooserOpen(true),
      closeChooser: () => setChooserOpen(false),
      setMode: (nextMode) => setModeState(nextMode),
      setPendingMode: (nextMode) => setPendingModeState(nextMode),
    }),
    [mode, pendingMode, chooserOpen],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useAppMode() {
  const context = useContext(ModeContext);

  if (!context) {
    throw new Error("useAppMode must be used within a ModeProvider");
  }

  return context;
}
