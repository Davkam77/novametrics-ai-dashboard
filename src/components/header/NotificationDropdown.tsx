import { useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type NotificationItem = {
  title: string;
  message: string;
  meta: string;
  tone: "success" | "warning" | "error";
};

const notifications: NotificationItem[] = [
  {
    title: "Model latency improved",
    message: "NovaGPT p95 dropped by 18% after the routing update.",
    meta: "5 min ago",
    tone: "success",
  },
  {
    title: "Token budget alert",
    message: "Enterprise workspace reached 82% of the monthly token cap.",
    meta: "18 min ago",
    tone: "warning",
  },
  {
    title: "Automation failure spike",
    message: "Two scheduled runs failed in the lead enrichment workflow.",
    meta: "42 min ago",
    tone: "error",
  },
];

const toneStyles = {
  success: "bg-success-500",
  warning: "bg-orange-500",
  error: "bg-error-500",
} as const;

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-theme-xs transition hover:border-brand-200 hover:text-brand-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-500/30 dark:hover:text-brand-300"
        onClick={() => {
          setIsOpen((value) => !value);
          setHasUnread(false);
        }}
        aria-label="Open notifications"
      >
        {hasUnread && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-gray-950" />
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2.25C6.89116 2.25 4.375 4.76616 4.375 7.875V11.5417L3.125 13.4583V14.75H16.875V13.4583L15.625 11.5417V7.875C15.625 4.76616 13.1088 2.25 10 2.25ZM10 17.75C11.3807 17.75 12.5 16.6307 12.5 15.25H7.5C7.5 16.6307 8.61929 17.75 10 17.75Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="right-0 mt-3 w-[340px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-theme-lg dark:border-gray-800 dark:bg-gray-950 sm:w-[380px]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-gray-800">
          <div>
            <h5 className="text-base font-semibold text-gray-900 dark:text-white">
              Notifications
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Latest workspace events
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Close notifications"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {notifications.map((notification) => (
            <DropdownItem
              key={notification.title}
              onItemClick={() => setIsOpen(false)}
              className="flex gap-3 border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${toneStyles[notification.tone]}`}
              />
              <span className="block">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                  {notification.title}
                </span>
                <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                  {notification.message}
                </span>
                <span className="mt-2 block text-xs text-gray-400 dark:text-gray-500">
                  {notification.meta}
                </span>
              </span>
            </DropdownItem>
          ))}
        </div>

        <Link
          to="/settings"
          className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-gray-800 dark:text-brand-300 dark:hover:bg-brand-500/10"
          onClick={() => setIsOpen(false)}
        >
          Notification settings
        </Link>
      </Dropdown>
    </div>
  );
}
