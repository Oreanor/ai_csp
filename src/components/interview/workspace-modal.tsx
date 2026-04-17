"use client";

import { HistoryModalContent } from "@/components/interview/history-modal-content";
import { SessionsModalContent } from "@/components/interview/sessions-modal-content";
import { SettingsModalContent } from "@/components/interview/settings-modal-content";
import { Dialog } from "@/components/ui/dialog";
import { LightboxDialogContent } from "@/components/ui/lightbox-dialog";
import type { TopModalView } from "@/types/interview";

type WorkspaceModalProps = {
  activeModal: TopModalView | null;
  onOpenChange: (open: boolean) => void;
  interviewBaseSystemPrompt: string;
  onInterviewSettingsSaved: (next: { baseSystemPrompt: string; updatedAt: string }) => void;
};

export function WorkspaceModal({
  activeModal,
  onOpenChange,
  interviewBaseSystemPrompt,
  onInterviewSettingsSaved,
}: WorkspaceModalProps) {
  return (
    <Dialog open={activeModal !== null} onOpenChange={onOpenChange}>
      {activeModal !== null && (
        <LightboxDialogContent key={activeModal} size="medium">
          {activeModal === "settings" ? (
            <SettingsModalContent
              onOpenChange={onOpenChange}
              interviewBaseSystemPrompt={interviewBaseSystemPrompt}
              onInterviewSettingsSaved={onInterviewSettingsSaved}
            />
          ) : activeModal === "sessions" ? (
            <SessionsModalContent onOpenChange={onOpenChange} />
          ) : (
            <HistoryModalContent onOpenChange={onOpenChange} />
          )}
        </LightboxDialogContent>
      )}
    </Dialog>
  );
}
