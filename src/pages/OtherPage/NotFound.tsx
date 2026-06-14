import GridShape from "../../components/common/GridShape";
import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Page Not Found"
        description="The requested page could not be found."
      />
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
        <GridShape />
        <div className="relative z-10 mx-auto w-full max-w-[520px] text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600 dark:text-brand-300">
            404
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">
            The route you requested does not exist in the NovaMetrics AI
            workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
            >
              Return to dashboard
            </Link>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-theme-xs transition hover:border-brand-200 hover:text-brand-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-500/30 dark:hover:text-brand-300"
            >
              Go to settings
            </Link>
          </div>
        </div>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} NovaMetrics AI
        </p>
      </div>
    </>
  );
}
