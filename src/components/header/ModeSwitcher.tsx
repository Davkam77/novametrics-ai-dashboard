import { useAppMode } from "../../context/ModeContext";

export default function ModeSwitcher() {
  const { mode, pendingMode, openChooser } = useAppMode();

  const label =
    mode === "real" ? "Real Mode" : mode === "demo" ? "Demo Mode" : "Choose Mode";

  return (
    <button
      type="button"
      onClick={openChooser}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-theme-xs transition hover:border-brand-200 hover:text-brand-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-500/30 dark:hover:text-brand-300"
      aria-label="Open workspace mode chooser"
      title="Open workspace mode chooser"
    >
      <span className="h-2 w-2 rounded-full bg-brand-500" />
      <span>{label}</span>
      {pendingMode === "real" && mode === "demo" && (
        <span className="hidden sm:inline text-[10px] font-medium text-amber-600 dark:text-amber-300">
          Sign in needed
        </span>
      )}
    </button>
  );
}
