export const DARK_MODE_STORAGE_KEY = "darkMode";

export function getInitialDarkMode(
  stored: string | null,
  prefersDark: boolean
): boolean {
  if (stored != null) return stored === "true";
  return prefersDark;
}
