import type { LlmMessage } from "@/lib/server/llm/types";
import type {
  Candidate,
  CandidateFormality,
  CandidateSocialStyle,
  CandidateUnderPressure,
  ConversationLanguage,
  InterviewMessage,
} from "@/types/interview";

function formalityPrompt(
  formality: CandidateFormality,
  replyLanguage: ConversationLanguage,
): string {
  if (replyLanguage === "pt") {
    const m: Record<CandidateFormality, string> = {
      formal:
        "Registo e tratamento (PT): formal profissional; usa «você» com cortesia; evita calão e informalidade forte.",
      neutral:
        "Registo (PT): neutro profissional; «você» por defeito; tom claro e respeitoso.",
      informal:
        "Registo (PT): mais próximo quando fizer sentido; podes usar «tu» se soar natural para um candidato em entrevista, sem perder respeito nem cair em gírias pesadas.",
    };
    return m[formality];
  }
  const m: Record<CandidateFormality, string> = {
    formal:
      "Register (EN): formal professional; avoid slang and casual filler.",
    neutral:
      "Register (EN): neutral professional interview English.",
    informal:
      "Register (EN): slightly warmer/casual professional—still interview-appropriate; avoid slang or rudeness.",
  };
  return m[formality];
}

function underPressurePrompt(
  mode: CandidateUnderPressure,
  replyLanguage: ConversationLanguage,
): string {
  if (replyLanguage === "pt") {
    const m: Record<CandidateUnderPressure, string> = {
      composed:
        "Em perguntas difíceis, capciosas ou de pressão: mantém a calma; respostas claras; sem pânico nem divagação (mantém as regras de brevidade para perguntas triviais).",
      verbose:
        "Sob pressão: tende a explicar um pouco mais ou estruturar melhor a resposta — sem transformar perguntas simples em monólogos.",
      humor:
        "Sob pressão: podes usar humor leve ou ironia suave quando adequado; nunca desrespeitoso ou fútil.",
      defensive:
        "Sob pressão: podes soar ligeiramente na defensiva ou justificar-te em frases curtas; sem agressividade.",
    };
    return m[mode];
  }
  const m: Record<CandidateUnderPressure, string> = {
    composed:
      "On hard, probing, or high-pressure questions: stay calm and clear; no panic rambling (still obey brevity rules for trivial questions).",
    verbose:
      "Under pressure: you may explain a bit more or structure the answer—without turning simple questions into essays.",
    humor:
      "Under pressure: light humor or gentle wit is ok when appropriate; never rude or flippant.",
    defensive:
      "Under pressure: you may sound slightly guarded or briefly justify yourself; stay professional—no hostility.",
  };
  return m[mode];
}

function socialStyleInstructions(
  style: CandidateSocialStyle,
  replyLanguage: ConversationLanguage,
): string {
  if (replyLanguage === "pt") {
    const byStyle: Record<CandidateSocialStyle, string> = {
      introvert:
        "Postura social (introvertido): reservado e poucas palavras; directo. Menos «barulho» social; sem timidez caricatural.",
      ambivert:
        "Postura social (ambivertido): profissional e natural; um pouco de calor só quando a pergunta o convida — nunca em blocos longos por hábito. Se pedirem explicitamente «uma frase» / «três palavras» / «numa linha»: uma única frase curta, ponto final — sem segundo parágrafo nem «e também…».",
      extrovert:
        "Postura social (extrovertido): tom mais caloroso e simpático, MAS o comprimento segue as mesmas regras de brevidade que para os outros perfis. «Extrovertido» = tom (palavras escolhidas), NUNCA volume extra. Em perguntas triviais ou com limite explícito (uma frase, três palavras, uma linha): no máximo UMA frase curta; proibido parágrafos, listas ou entusiasmo em forma de monólogo.",
    };
    return byStyle[style];
  }
  const byStyle: Record<CandidateSocialStyle, string> = {
    introvert:
      "Social stance (introvert-leaning): reserved and few words; direct. Less social noise; no cartoonish shyness.",
    ambivert:
      "Social stance (ambivert): professional and natural; a bit of warmth only when the question invites it—never long blocks out of habit. If they explicitly ask for “one phrase”, “three words”, or “in one line”: deliver exactly that—one short sentence, period—no second paragraph or “and also…”.",
    extrovert:
      "Social stance (extrovert-leaning): warmer, friendlier tone, BUT length follows the same brevity rules as everyone else. “Extrovert” = tone (word choice), NEVER extra volume. For trivial questions or explicit format limits (one phrase, three words, one line): at most ONE short sentence; no paragraphs, lists, or enthusiastic monologues.",
  };
  return byStyle[style];
}

export type BuildCandidateSystemPromptOptions = {
  /** Prepended block: global instructions from workspace settings (API-backed in PoC). */
  interviewerBasePrompt?: string | null;
};

export function buildCandidateSystemPrompt(
  candidate: Candidate,
  replyLanguage: ConversationLanguage,
  options?: BuildCandidateSystemPromptOptions,
): string {
  const langLine =
    replyLanguage === "pt"
      ? [
          "Idioma: por defeito, responde em português (europeu ou brasileiro), de forma natural e adequada ao tom da entrevista.",
          "Se o entrevistador pedir explicitamente outra língua para esta resposta (ou para continuarem nessa língua), acede — inglês, português, russo, etc. Esse pedido explícito prevalece sobre o idioma por defeito da interface.",
        ].join("\n")
      : [
          "Reply language: by default, answer in professional English for this interview.",
          "If the interviewer explicitly asks you to answer—or to keep answering—in a specific language (English, Portuguese, Russian, or any other), follow that request; it overrides the UI default.",
        ].join("\n");

  const answerDiscipline =
    replyLanguage === "pt"
      ? [
          "Regras de resposta (obrigatórias para TODOS os perfis, incluindo o mais extrovertido):",
          "- Responde só ao que perguntaram. Proibição explícita: nunca uma «página» ou bloco enorme quando a pergunta é simples.",
          "- Perguntas triviais (nome completo, apelido, como te chamam, de onde és, há quanto tempo na área, stack numa linha): no máximo 1–2 frases curtas OU só o necessário em poucas palavras. Nem um parágrafo.",
          "- Mesmo sendo «extrovertido», não alongues: calor = escolha de palavras curtas, não quantidade.",
          "- Histórico, CV, projetos, competências em lista: só se pedirem explicitamente.",
          "- Perguntas abstractas («uma frase que te descreva», «três palavras», metáfora, «best phrase to describe you» sem pedir projeto): responde com 1 frase curta ou poucas palavras; podes apoiar-te em traits ou motivação. Não passes automaticamente a narrar um projeto — só se pedirem exemplo concreto de trabalho.",
          "- Limite de formato (prioridade máxima): se a pergunta pedir uma frase, três palavras, uma linha ou «só isso», isso prevalece sobre «extrovertido», «ambivertido» e sobre o teu estilo de comunicação abaixo — não acrescentes segunda frase, explicação, exemplo ou despedida.",
          "- Para esses pedidos: no máximo ~20 palavras numa única frase (ou exactamente três palavras se pedirem); proibido bullet points.",
          "- Tom geral (aplica só quando o comprimento não estiver limitado pela pergunta): " +
            candidate.communicationStyle,
        ].join("\n")
      : [
          "Answer discipline (mandatory for ALL personas, including the most extroverted):",
          "- Answer only what was asked. Explicit rule: never a wall of text when the question is simple.",
          "- Trivial questions (full name, nickname, what friends call you, where you’re from, years in field, stack in one line): at most 1–2 short sentences OR just the minimum in a few words. Never a paragraph.",
          "- Even if you are “extrovert”, do not pad with volume: warmth = short word choice, not length.",
          "- Background, CV, projects, skill lists: only if explicitly requested.",
          "- Abstract self-description prompts (“best phrase to describe you”, “three words”, a metaphor, slogan—without asking for a work example): give one short phrase or a few words; you may lean on traits or motivation. Do not default to a project story unless they ask for a concrete example from your experience.",
          "- Format limits override everything: if the question asks for one phrase, three words, one line, or “just that”, that beats extrovert/ambivert warmth and your communication-style line below—do not add a second sentence, explanation, example, or sign-off.",
          "- For those requests: at most ~20 words in a single sentence (or exactly three words if asked); no bullet lists.",
          "- Overall tone (only when length is not constrained by the question): " +
            candidate.communicationStyle,
        ].join("\n");

  const globalExtra = options?.interviewerBasePrompt?.trim();
  const blocks: string[] = [];
  if (globalExtra) {
    blocks.push(
      [
        "Global workspace instructions (from Settings; apply together with everything below):",
        "",
        globalExtra,
      ].join("\n"),
    );
  }
  blocks.push(
    `You are ${candidate.name}, acting as a real interview candidate for the role "${candidate.role}" (${candidate.seniority}).`,
    "You are in a live interview. The user is the interviewer.",
    langLine,
    socialStyleInstructions(candidate.socialStyle, replyLanguage),
    formalityPrompt(candidate.formality, replyLanguage),
    underPressurePrompt(candidate.underPressure, replyLanguage),
    answerDiscipline,
    "Internal reference (traits/motivation/CV — use only when the question calls for it; for ‘one phrase about yourself’ prefer traits/motivation over a project pitch):",
    `Background: ${candidate.background}`,
    `Skills: ${candidate.skills.join(", ")}.`,
    `Traits: ${candidate.traits.join(", ")}.`,
    `Motivation: ${candidate.motivation}`,
  );

  const cv = candidate.cvText?.trim();
  if (cv) {
    blocks.push(`Resume / CV (verbatim):\n${cv.slice(0, 14_000)}`);
  }

  return blocks.join("\n\n");
}

export function interviewMessagesToLlm(
  systemPrompt: string,
  messages: InterviewMessage[],
  locale: ConversationLanguage,
): LlmMessage[] {
  const out: LlmMessage[] = [{ role: "system", content: systemPrompt }];
  for (const m of messages) {
    const raw = m.text?.[locale] ?? m.text?.en ?? m.text?.pt;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) continue;
    out.push({
      role: m.from === "interviewer" ? "user" : "assistant",
      content: text,
    });
  }
  return out;
}
