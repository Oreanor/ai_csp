"use client";

import type { ReactNode } from "react";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { AppThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppThemeProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </AppThemeProvider>
  );
}
