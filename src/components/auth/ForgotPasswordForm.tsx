import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";

export default function ForgotPasswordForm() {
  const { resetPassword, configurationError, isConfigured } = useAuth();
  const { setMode, setPendingMode } = useAppMode();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleBackToDemo = () => {
    setMode("demo");
    setPendingMode(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");

    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFeedback("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?mode=recovery&returnTo=${encodeURIComponent("/reset-password")}`;
      const result = await resetPassword(normalizedEmail, redirectTo);
      setFeedback(result.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          onClick={handleBackToDemo}
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <span className="mr-1 text-lg">←</span>
          Back to Sign In
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we will send a reset link.
          </p>
        </div>

        <div className="space-y-4">
          {configurationError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {configurationError}
            </div>
          )}

          {feedback && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
              {feedback}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={loading}
            >
              {loading ? "Sending reset email..." : "Send reset link"}
            </Button>
          </form>

          {!isConfigured && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Demo Mode remains available while Supabase is being configured.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link
              to="/signin"
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Sign in
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
  );
}
