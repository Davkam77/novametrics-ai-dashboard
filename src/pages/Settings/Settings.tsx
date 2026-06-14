import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { useTheme } from "../../context/ThemeContext";
import type { WorkspaceSettings } from "../../types/analytics";

const STORAGE_KEY = "novametrics-workspace-settings";

type SettingsFormState = {
  workspaceName: string;
  monthlyTokenLimit: string;
  theme: WorkspaceSettings["theme"];
  notifyApiThreshold: boolean;
  notifyAutomationSuccess: boolean;
  notifyErrorSpike: boolean;
};

const defaultFormState: SettingsFormState = {
  workspaceName: "NovaMetrics AI",
  monthlyTokenLimit: "250000000",
  theme: "light",
  notifyApiThreshold: true,
  notifyAutomationSuccess: true,
  notifyErrorSpike: true,
};

function readSettings(): SettingsFormState {
  if (typeof window === "undefined") {
    return defaultFormState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const theme = localStorage.getItem("theme");
      return {
        ...defaultFormState,
        theme: theme === "dark" ? "dark" : "light",
      };
    }

    const parsed = JSON.parse(raw) as Partial<SettingsFormState>;
    return {
      workspaceName: parsed.workspaceName || defaultFormState.workspaceName,
      monthlyTokenLimit:
        parsed.monthlyTokenLimit || defaultFormState.monthlyTokenLimit,
      theme: parsed.theme === "dark" ? "dark" : "light",
      notifyApiThreshold:
        typeof parsed.notifyApiThreshold === "boolean"
          ? parsed.notifyApiThreshold
          : defaultFormState.notifyApiThreshold,
      notifyAutomationSuccess:
        typeof parsed.notifyAutomationSuccess === "boolean"
          ? parsed.notifyAutomationSuccess
          : defaultFormState.notifyAutomationSuccess,
      notifyErrorSpike:
        typeof parsed.notifyErrorSpike === "boolean"
          ? parsed.notifyErrorSpike
          : defaultFormState.notifyErrorSpike,
    };
  } catch {
    return defaultFormState;
  }
}

export default function Settings() {
  const { setTheme } = useTheme();
  const [form, setForm] = useState<SettingsFormState>(defaultFormState);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const saved = readSettings();
    setForm(saved);
    setTheme(saved.theme);
  }, [setTheme]);

  const updateField = <K extends keyof SettingsFormState>(
    key: K,
    value: SettingsFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSaveMessage("");
  };

  const handleSave = () => {
    const normalizedLimit = String(
      Math.max(0, Number.parseInt(form.monthlyTokenLimit, 10) || 0),
    );
    const nextForm = {
      ...form,
      monthlyTokenLimit: normalizedLimit,
    };

    setForm(nextForm);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextForm));
    localStorage.setItem("theme", nextForm.theme);
    setTheme(nextForm.theme);
    setSaveMessage("Settings saved.");
  };

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Settings"
        description="Workspace preferences, notifications, and theme selection."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Settings" />

        <section className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Workspace profile
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Adjust the workspace identity and visual preferences used across the demo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workspace name
                </span>
                <input
                  type="text"
                  value={form.workspaceName}
                  onChange={(event) =>
                    updateField("workspaceName", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monthly token limit
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.monthlyTokenLimit}
                  onChange={(event) =>
                    updateField("monthlyTokenLimit", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default theme
                </span>
                <select
                  value={form.theme}
                  onChange={(event) =>
                    updateField("theme", event.target.value as WorkspaceSettings["theme"])
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                  Persistence
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Saved locally in the browser
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alerts
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure the workspace notifications shown in the demo UI.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: "notifyApiThreshold" as const,
                  label: "API threshold alerts",
                  description: "Notify when request volume approaches the alert threshold.",
                },
                {
                  key: "notifyAutomationSuccess" as const,
                  label: "Automation success notices",
                  description: "Show a status update after successful workflow runs.",
                },
                {
                  key: "notifyErrorSpike" as const,
                  label: "Error spike alerts",
                  description: "Highlight sudden jumps in failed requests or runs.",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
                >
                  <span className="block">
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form[item.key]}
                    onChange={(event) =>
                      updateField(item.key, event.target.checked)
                    }
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {saveMessage || "Changes are stored locally when you save."}
              </p>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Save changes
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
