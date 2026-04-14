"use client";

import { useState } from "react";
import { Mic, SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InterviewControlBarProps = {
  onSendMessage: (text: string) => void;
};

export function InterviewControlBar({ onSendMessage }: InterviewControlBarProps) {
  const tInterview = useTranslations("Interview");
  const tVoice = useTranslations("Voice");
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSendMessage(text);
    setDraft("");
  };

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-fit shrink-0 gap-2 px-3"
              aria-label={tVoice("micAria")}
            >
              <Mic className="size-5 shrink-0" />
              <span>{tVoice("pressToSpeak")}</span>
            </Button>
            <Button type="button" variant="outline" className="h-10 w-24 shrink-0 px-0">
              {tInterview("pause")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 w-24 shrink-0 px-0"
            >
              {tInterview("stop")}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder={tInterview("inputPlaceholder")}
            className="h-10 min-w-0 flex-1"
            aria-label={tInterview("inputPlaceholder")}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-10 shrink-0"
            aria-label={tInterview("sendMessage")}
            onClick={send}
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
