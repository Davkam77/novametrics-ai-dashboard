import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { useAppMode } from "../../context/ModeContext";
import { supabase, supabaseConfigMessage } from "../../lib/supabaseClient";
import { sanitizeInternalPath } from "../../lib/navigation";

export default function AuthCallback() {
  const { setMode, setPendingMode } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");
  const [message, setMessage] = useState("Completing authentication...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const mode = params.get("mode");
      const returnTo = sanitizeInternalPath(params.get("returnTo"));

      if (!supabase) {
        setStatus("error");
        setMessage(
          supabaseConfigMessage ??
            "Supabase is not configured yet. Demo Mode remains available.",
        );
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Missing authentication code.");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        setStatus("error");
        setMessage("Unable to complete sign in. Please try again.");
        return;
      }

      setMode("real");
      setPendingMode(null);
      setStatus("done");

      if (mode === "recovery") {
        navigate("/reset-password", { replace: true });
        return;
      }

      navigate(returnTo, { replace: true });
    };

    void run();
  }, [location.search, navigate, setMode, setPendingMode]);

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Authenticating"
        description="Completing the NovaMetrics AI authentication flow."
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Authentication
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>

              {status === "error" && (
                <div className="mt-4 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
                  {message}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Go to Sign In
                </Link>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Back to Demo Mode
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
