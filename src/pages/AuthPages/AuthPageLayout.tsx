import type React from "react";
import { Link } from "react-router";
import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[color:var(--app-bg)] text-[color:var(--app-text)]">
      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {children}

        <div className="hidden w-full items-center justify-center bg-brand-950 px-8 py-10 text-white lg:flex lg:w-1/2">
          <div className="relative flex max-w-lg items-center justify-center">
            <GridShape />
            <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
              <Link to="/" className="mb-6 inline-flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-brand-700">
                  NM
                </span>
                <span className="text-left">
                  <span className="block text-2xl font-semibold tracking-tight">
                    NovaMetrics AI
                  </span>
                  <span className="block text-sm text-white/70">
                    AI SaaS analytics dashboard
                  </span>
                </span>
              </Link>
              <p className="text-sm leading-6 text-white/70">
                Track revenue, AI consumption, API performance, and automation reliability across your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
