import { Link } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import Button from "../ui/button/Button";
import { useAppMode } from "../../context/ModeContext";

export default function ResetPasswordForm() {
  const { setMode, setPendingMode } = useAppMode();

  const handleBackToDemo = () => {
    setMode("demo");
    setPendingMode(null);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          onClick={handleBackToDemo}
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to Sign In
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Password recovery unavailable
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Password recovery is temporarily unavailable. Please contact
            support or return to Sign In.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
            Password recovery is temporarily unavailable.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleBackToDemo}
            >
              Back to Demo Mode
            </Button>
            <Link
              to="/signin"
              onClick={handleBackToDemo}
              className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
