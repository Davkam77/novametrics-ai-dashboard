export function sanitizeInternalPath(
  value: string | null | undefined,
  fallback = "/",
) {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function isAuthRoute(pathname: string) {
  return [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ].includes(pathname);
}
