"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { candidateShortName } from "@/lib/utils";
import type { Candidate, ConversationLanguage, InterviewMessage } from "@/types/interview";

type InterviewMessageLogProps = {
  candidate: Candidate;
  messages: InterviewMessage[];
  conversationLanguage: ConversationLanguage;
  candidateTyping?: boolean;
  candidateTypingLabel?: string;
};

export function InterviewMessageLog({
  candidate,
  messages,
  conversationLanguage,
  candidateTyping = false,
  candidateTypingLabel,
}: InterviewMessageLogProps) {
  const t = useTranslations("MessageLog");
  const tInterview = useTranslations("Interview");
  const endRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [messages, candidateTyping]);

  const showEmptyHint = messages.length === 0 && !candidateTyping;

  return (
    <section
      className="flex min-h-[min(36vh,260px)] min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-muted/30 shadow-inner"
      aria-label={t("panelAriaLabel")}
    >
      <header className="shrink-0 border-b border-border bg-card/90 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("panelTitle")}
        </h2>
      </header>
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]]:min-h-[11rem]">
        <div className="bg-card/50">
          {messages.map((message, index) => {
            const isCandidate = message.from === "candidate";
            return (
              <div key={message.id}>
                {index > 0 ? <Separator /> : null}
                <article className="grid grid-cols-[72px_1fr] px-4 py-2.5 text-sm">
                  <p
                    className={`font-semibold ${
                      isCandidate ? "text-brand" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isCandidate ? candidateShortName(candidate.name) : t("you")}
                  </p>
                  <p className="text-foreground/90">
                    {message.text[conversationLanguage]}
                  </p>
                </article>
              </div>
            );
          })}
          {showEmptyHint ? (
            <div className="flex min-h-[11rem] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
              <MessageSquare
                strokeWidth={1.25}
                className="h-10 w-10 text-muted-foreground/45"
              />
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t("emptyState")}
              </p>
            </div>
          ) : null}
          {candidateTyping ? (
            <>
              {messages.length > 0 ? <Separator /> : null}
              <article className="grid grid-cols-[72px_1fr] px-4 py-2.5 text-sm">
                <p className="font-semibold text-brand">{candidateShortName(candidate.name)}</p>
                <p className="text-muted-foreground italic">
                  {candidateTypingLabel ?? tInterview("candidateTyping")}
                </p>
              </article>
            </>
          ) : null}
          <div ref={endRef} className="h-0 overflow-hidden" aria-hidden />
        </div>
      </ScrollArea>
    </section>
  );
}
