import { useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { readPublicUserProfile } from "../../data/publicUserProfile";

const userMenuItems = [
  {
    label: "Workspace settings",
    to: "/settings",
  },
  {
    label: "AI usage dashboard",
    to: "/ai-usage",
  },
];

export default function UserDropdown() {
  const profile = readPublicUserProfile();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1 pr-3 text-gray-700 shadow-theme-xs transition hover:border-brand-200 hover:text-brand-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-500/30 dark:hover:text-brand-300"
        aria-label="Open user menu"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
          {profile.initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
            {profile.name}
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {profile.role}
          </span>
        </span>
        <svg
          className={`hidden text-gray-500 transition-transform duration-200 dark:text-gray-400 sm:block ${isOpen ? "rotate-180" : ""}`}
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 6.75L9 11.25L13.5 6.75"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="right-0 mt-3 w-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-theme-lg dark:border-gray-800 dark:bg-gray-950"
      >
        <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-sm font-bold text-white">
              {profile.initials}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {profile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {profile.email}
              </p>
            </div>
          </div>
        </div>

        <div className="px-2 py-2">
          {userMenuItems.map((item) => (
            <DropdownItem
              key={item.to}
              tag="a"
              to={item.to}
              onItemClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              {item.label}
            </DropdownItem>
          ))}
        </div>

        <div className="border-t border-gray-100 px-2 py-2 dark:border-gray-800">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Back to dashboard
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
