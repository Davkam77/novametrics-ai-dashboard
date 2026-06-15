import type { PlatformRole } from "../../types/auth";

type RealAnalyticsPlaceholderProps = {
  role: PlatformRole;
  pageTitle: string;
  description: string;
  details: string[];
};

const copyByRole: Record<
  PlatformRole,
  {
    eyebrow: string;
    title: string;
  }
> = {
  user: {
    eyebrow: "Real user workspace",
    title: "No real usage data yet",
  },
  admin: {
    eyebrow: "Real admin workspace",
    title: "Real platform analytics are not connected yet",
  },
};

export default function RealAnalyticsPlaceholder({
  role,
  pageTitle,
  description,
  details,
}: RealAnalyticsPlaceholderProps) {
  const copy = copyByRole[role];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
        Real Mode
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {details.map((detail) => (
              <li key={detail} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-500" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
