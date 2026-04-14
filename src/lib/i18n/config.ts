export type AppLocale = "en" | "pt";

export const defaultLocale: AppLocale = "en";

export const locales: AppLocale[] = ["en", "pt"];

export function isAppLocale(value: string | null): value is AppLocale {
  return value === "en" || value === "pt";
}
