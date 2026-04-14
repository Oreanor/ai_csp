"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { candidateShortName } from "@/lib/utils";
import type { Candidate, ConversationLanguage, InterviewMessage } from "@/types/interview";

type InterviewMessageLogProps = {
  candidate: Candidate;
  messages: InterviewMessage[];
  conversationLanguage: ConversationLanguage;
};

export function InterviewMessageLog({
  candidate,
  messages,
  conversationLanguage,
}: InterviewMessageLogProps) {
  const t = useTranslations("MessageLog");
  const endRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [messages]);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="bg-card">
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
        <div ref={endRef} className="h-0 overflow-hidden" aria-hidden />
      </div>
    </ScrollArea>
  );
}
