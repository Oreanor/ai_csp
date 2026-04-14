"use client";

import * as React from "react";

import { DialogContent, DialogHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type LightboxSize = "medium" | "wide" | "xl";

const sizeClasses: Record<LightboxSize, string> = {
  medium:
    "max-w-[min(42rem,calc(100vw-2rem))] sm:max-w-[min(42rem,calc(100vw-2rem))]",
  wide: "max-w-[min(56rem,calc(100vw-2rem))] sm:max-w-[min(56rem,calc(100vw-2rem))]",
  xl: "max-w-[min(64rem,calc(100vw-2rem))] sm:max-w-[min(64rem,calc(100vw-2rem))]",
};

type LightboxDialogContentProps = React.ComponentProps<typeof DialogContent> & {
  size?: LightboxSize;
};

function LightboxDialogContent({
  className,
  size = "wide",
  ...props
}: LightboxDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "flex min-h-0 max-h-[min(90vh,920px)] w-full flex-col gap-0 overflow-hidden p-0",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

function LightboxDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn(
        "shrink-0 gap-2 px-6 pb-3 pt-6 pr-14 text-left sm:px-10 sm:pr-16",
        className
      )}
      {...props}
    />
  );
}

function LightboxDialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] px-6 pb-6 sm:px-10",
        className
      )}
      {...props}
    />
  );
}

export type LightboxFooterAlign = "center" | "end" | "start";

function LightboxDialogFooter({
  align = "end",
  className,
  ...props
}: React.ComponentProps<"div"> & { align?: LightboxFooterAlign }) {
  const justify =
    align === "center"
      ? "justify-center"
      : align === "start"
        ? "justify-start"
        : "justify-end";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-row flex-wrap gap-3 rounded-b-xl border-t border-border bg-muted/30 px-6 py-5 pb-7 pt-4 sm:px-10 sm:pb-8",
        justify,
        className
      )}
      {...props}
    />
  );
}

export {
  LightboxDialogBody,
  LightboxDialogContent,
  LightboxDialogFooter,
  LightboxDialogHeader,
};
