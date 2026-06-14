import { useLocation, useNavigate } from "react-router";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import { supabaseConfigMessage } from "../../lib/supabaseClient";

function isSafeReturnPath(pathname: string) {
  return pathname.startsWith("/") && !pathname.startsWith("//");
}

export default function ModeChooserModal() {
  const { status } = useAuth();
  const {
    mode,
    chooserOpen,
    closeChooser,
    setMode,
    setPendingMode,
  } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();
  const isMandatory = mode === "unselected";
  const isOpen = isMandatory || chooserOpen;
  const destination = isSafeReturnPath(location.pathname) ? location.pathname : "/";

  if (!isOpen) {
    return null;
  }

  const handleDemo = () => {
    setMode("demo");
    setPendingMode(null);
    closeChooser();
    navigate(destination, { replace: true });
  };

  const handleReal = () => {
    closeChooser();

    if (status === "authenticated") {
      setMode("real");
      setPendingMode(null);
      navigate(destination, { replace: true });
      return;
    }

    setPendingMode("real");
    setMode("demo");
    navigate(`/signin?returnTo=${encodeURIComponent(destination)}`, {
      replace: true,
    });
  };

  const content = (
    <div className="mx-auto w-full max-w-[740px] p-4 sm:p-6">
      <div className="rounded-[28px] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-7 sm:py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
            NovaMetrics AI
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Choose your workspace mode
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Explore the sample dashboard with mock data, or sign in to use your
            account-based workspace.
          </p>
          {supabaseConfigMessage && (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {supabaseConfigMessage}
            </p>
          )}
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-7 sm:py-7 lg:grid-cols-2">
          <button
            type="button"
            onClick={handleDemo}
            className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-brand-300 hover:bg-brand-50/60 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
              Explore Demo
            </span>
            <span className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
              Sample data dashboard
            </span>
            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Public dashboard access with fictional analytics, no sign in
              required, and no private data or AI requests.
            </p>
            <span className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-sm ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-brand-300 dark:ring-gray-800">
              Open Demo Mode
            </span>
          </button>

          <button
            type="button"
            onClick={handleReal}
            className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-brand-300 hover:bg-brand-50/60 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
              Use Real Platform
            </span>
            <span className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
              Account-based workspace
            </span>
            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Sign in to continue with your own workspace, profiles, and future
              private data.
            </p>
            <span className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-sm ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-brand-300 dark:ring-gray-800">
              {status === "authenticated" ? "Open Real Mode" : "Continue to Sign In"}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span>Mode selection is stored locally in your browser.</span>
          {!isMandatory && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => closeChooser()}
              className="px-4 py-2.5"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isMandatory) {
          closeChooser();
        }
      }}
      className="max-w-[780px] bg-transparent shadow-none"
      showCloseButton={!isMandatory}
      closeOnEscape={!isMandatory}
      closeOnBackdrop={!isMandatory}
      trapFocus
    >
      {content}
    </Modal>
  );
}
