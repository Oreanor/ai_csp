"use client";

import type { ComponentProps } from "react";
import { ThemeProvider } from "next-themes";

type AppThemeProviderProps = ComponentProps<typeof ThemeProvider>;

export function AppThemeProvider({ children, ...props }: AppThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </ThemeProvider>
  );
}
