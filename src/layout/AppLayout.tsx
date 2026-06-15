import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import ModeChooserModal from "../components/common/ModeChooserModal";
import { useAppMode } from "../context/ModeContext";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { mode, setMode, setPendingMode } = useAppMode();
  const {
    status,
    session,
    configurationError,
    accountErrorKind,
    refreshProfile,
    signOut,
  } = useAuth();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (mode !== "real") {
      return;
    }

    if (status === "loading" || status === "authenticated" || session) {
      return;
    }

    setMode("demo");
    setPendingMode("real");
  }, [mode, setMode, setPendingMode, session, status]);

  const handleRetry = async () => {
    setRetrying(true);

    try {
      await refreshProfile();
    } finally {
      setRetrying(false);
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();

    if (result.ok) {
      setMode("demo");
      setPendingMode(null);
    }
  };

  const accountErrorTitle =
    accountErrorKind === "query_error"
      ? "Unable to load workspace"
      : "Workspace setup incomplete";
  const accountErrorDescription =
    accountErrorKind === "query_error"
      ? "Unable to load your workspace right now. Please try again."
      : "Your workspace setup is incomplete. Please contact support or try again.";

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-4 md:px-6 md:py-6">
          {mode === "real" && status === "error" && session && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900 shadow-theme-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {accountErrorTitle}
                  </p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/90">
                    {accountErrorDescription ||
                      configurationError ||
                      "Please try again or sign out."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-400/40 dark:bg-gray-950 dark:text-amber-100 dark:hover:bg-white/5"
                  >
                    {retrying ? "Retrying..." : "Retry load"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
          <Outlet />
        </div>
        <ModeChooserModal />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
