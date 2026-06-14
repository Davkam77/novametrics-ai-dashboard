export type PublicUserProfile = {
  name: string;
  initials: string;
  role: string;
  email: string;
};

export const defaultPublicUserProfile: PublicUserProfile = {
  name: "Guest User",
  initials: "GU",
  role: "Viewer",
  email: "guest@novametrics.ai",
};

const legacyProfileKeys = [
  "novametrics-public-profile",
  "novametrics-user-profile",
  "novametrics-user",
];

function isLegacyDavitProfile(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("davit marikyan") ||
    normalized.includes("workspace admin") ||
    normalized.includes("workspace administrator") ||
    normalized.includes("\"dm\"")
  );
}

export function readPublicUserProfile(): PublicUserProfile {
  if (typeof window === "undefined") {
    return defaultPublicUserProfile;
  }

  for (const key of legacyProfileKeys) {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      continue;
    }

    if (isLegacyDavitProfile(rawValue)) {
      try {
        localStorage.setItem(key, JSON.stringify(defaultPublicUserProfile));
      } catch {
        // Ignore storage failures and fall back to the public guest identity.
      }

      return defaultPublicUserProfile;
    }
  }

  return defaultPublicUserProfile;
}
