import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import { sanitizeInternalPath } from "../../lib/navigation";

export default function SignInForm() {
  const { signIn, status, isConfigured, configurationError } = useAuth();
  const { setMode, setPendingMode } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");

    const normalizedEmail = email.trim();

    if (!validateEmail(normalizedEmail)) {
      setFeedback("Enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setFeedback("Enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(normalizedEmail, password);

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setMode("real");
      setPendingMode(null);
      navigate(returnTo, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDemo = () => {
    setMode("demo");
    setPendingMode(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
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
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to access your account-based NovaMetrics workspace.
            </p>
          </div>
          <div className="space-y-4">
            {configurationError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                {configurationError}
              </div>
            )}

            {feedback && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  feedback.toLowerCase().includes("check your email")
                    ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-200"
                    : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200"
                }`}
              >
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
                  error={Boolean(feedback) && !validateEmail(email)}
                />
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  to="/forgot-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot Password?
                </Link>
                <Link
                  to="/signup"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Register
                </Link>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>

            {!isConfigured && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Demo Mode is still available while Supabase is being configured.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
