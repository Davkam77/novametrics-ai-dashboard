import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import { sanitizeInternalPath } from "../../lib/navigation";

export default function SignUpForm() {
  const { signUp, status, isConfigured, configurationError } = useAuth();
  const { setMode, setPendingMode } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState("");
  const returnTo = sanitizeInternalPath(
    new URLSearchParams(location.search).get("returnTo"),
  );

  useEffect(() => {
    if (status === "authenticated") {
      setMode("real");
      setPendingMode(null);
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo, setMode, setPendingMode, status]);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleBackToDemo = () => {
    setMode("demo");
    setPendingMode(null);
    navigate("/", { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");
    setSuccess("");

    const normalizedDisplayName = displayName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedDisplayName) {
      setFeedback("Display name is required.");
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setFeedback("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setFeedback("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("Passwords do not match.");
      return;
    }

    if (!isChecked) {
      setFeedback("Please confirm the terms before continuing.");
      return;
    }

    setLoading(true);

    try {
      const isLocalHost = ["localhost", "127.0.0.1"].includes(
        window.location.hostname,
      );
      const redirectTo = isLocalHost
        ? undefined
        : `${window.location.origin}/auth/callback?mode=signup&returnTo=${encodeURIComponent(
            returnTo,
          )}`;

      const result = await signUp({
        displayName: normalizedDisplayName,
        email: normalizedEmail,
        password,
        redirectTo,
      });

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setPendingMode("real");
        setMode("demo");
        setSuccess(result.message);
        return;
      }

      setMode("real");
      setPendingMode(null);
      navigate(returnTo, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <button
          type="button"
          onClick={handleBackToDemo}
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to Demo Mode
        </button>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Register a real workspace account for NovaMetrics AI.
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
                <Label>Display name</Label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1 w-5 h-5"
                  checked={isChecked}
                  onChange={setIsChecked}
                />
                <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                  I agree to the Terms and Privacy Policy.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            {!isConfigured && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Demo Mode is still available while Supabase is being configured.
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
    </div>
  );
}
