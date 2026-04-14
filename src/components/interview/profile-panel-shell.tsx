"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ProfilePanelBody } from "@/components/interview/profile-panel-body";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Candidate } from "@/types/interview";

type ProfilePanelShellProps = {
  candidate: Candidate;
  onClose?: () => void;
};

export function ProfilePanelShell({ candidate, onClose }: ProfilePanelShellProps) {
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
            <ProfilePanelBody candidate={candidate} />
          </div>
        </ScrollArea>
      </TabsContent>
      <TabsContent value="session" className="mt-0 flex-1 p-4 text-muted-foreground outline-none">
        {t("sessionPlaceholder")}
      </TabsContent>
    </Tabs>
  );
}
