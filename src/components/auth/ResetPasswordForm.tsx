import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";

export default function ResetPasswordForm() {
  const { updatePassword, configurationError, isConfigured, status } = useAuth();
  const { setMode, setPendingMode } = useAppMode();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "guest" && isConfigured) {
      setFeedback("Use the password reset link from your email to open this page.");
    }
  }, [isConfigured, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");
    setSuccess("");

    if (password.length < 8) {
      setFeedback("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setMode("real");
      setPendingMode(null);
      setSuccess("Password updated successfully.");
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <span className="mr-1 text-lg">←</span>
          Back to Sign In
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set a new password for your account.
          </p>
        </div>

        <div className="space-y-4">
          {configurationError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {configurationError}
            </div>
          )}

          {feedback && (
            <div className="rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
              {feedback}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-200">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div>
              <Label>Confirm password</Label>
              <Input
                type="password"
                placeholder="Repeat the new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={loading}
            >
              {loading ? "Updating password..." : "Update password"}
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
