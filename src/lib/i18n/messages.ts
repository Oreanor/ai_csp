import type { AppLocale } from "@/lib/i18n/config";

import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

export type AppMessages = typeof en;

export const messagesByLocale: Record<AppLocale, AppMessages> = {
  en,
  pt,
};
