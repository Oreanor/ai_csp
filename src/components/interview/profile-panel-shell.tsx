"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ProfilePanelBody } from "@/components/interview/profile-panel-body";
import { ProfileSessionPanel } from "@/components/interview/profile-session-panel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppLocale } from "@/lib/i18n/config";
import type { Candidate, InterviewSessionMode } from "@/types/interview";

type ProfilePanelShellProps = {
  candidate: Candidate;
  onClose?: () => void;
  onEditProfile?: () => void;
  interviewTts?: ReactNode;
  sessionMode: InterviewSessionMode;
  sessionWallClockStartedAt: number | null;
  sessionElapsedMs: number;
  transcriptMessageCount: number;
  uiLocale: AppLocale;
  autoReadAloud: boolean;
  ttsBrowserSupported: boolean;
};

export function ProfilePanelShell({
  candidate,
  onClose,
  onEditProfile,
  interviewTts,
  sessionMode,
  sessionWallClockStartedAt,
  sessionElapsedMs,
  transcriptMessageCount,
  uiLocale,
  autoReadAloud,
  ttsBrowserSupported,
}: ProfilePanelShellProps) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");

  return (
    <Tabs
      defaultValue="profile"
      className="flex h-full min-h-0 flex-col border-border bg-muted/30"
    >
      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
        <TabsList
          variant="line"
          className="h-auto min-w-0 flex-1 justify-start bg-transparent p-0"
        >
          <TabsTrigger value="profile" className="rounded-none px-3 pb-2">
            {t("profileTab")}
          </TabsTrigger>
          <TabsTrigger value="session" className="rounded-none px-3 pb-2">
            {t("sessionTab")}
          </TabsTrigger>
        </TabsList>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-mr-1 shrink-0"
            onClick={onClose}
            aria-label={tCommon("close")}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <TabsContent value="profile" className="mt-0 min-h-0 flex-1 overflow-hidden p-0 outline-none">
        <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
          <div className="p-4">
            <ProfilePanelBody
              candidate={candidate}
              onEditProfile={onEditProfile}
              interviewTts={interviewTts}
            />
          </div>
        </ScrollArea>
      </TabsContent>
      <TabsContent value="session" className="mt-0 min-h-0 flex-1 overflow-hidden p-0 outline-none">
        <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
          <div className="p-4">
            <ProfileSessionPanel
              candidateName={candidate.name}
              sessionMode={sessionMode}
              sessionWallClockStartedAt={sessionWallClockStartedAt}
              sessionElapsedMs={sessionElapsedMs}
              transcriptMessageCount={transcriptMessageCount}
              uiLocale={uiLocale}
              autoReadAloud={autoReadAloud}
              ttsBrowserSupported={ttsBrowserSupported}
            />
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
