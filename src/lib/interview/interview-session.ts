import type { InterviewSessionMode } from "@/types/interview";

export type InterviewSessionClock = {
  mode: InterviewSessionMode;
  accumulatedMs: number;
  segmentStartedAt: number | null;
  wallClockStartedAt: number | null;
};

export const initialInterviewSessionClock: InterviewSessionClock = {
  mode: "idle",
  accumulatedMs: 0,
  segmentStartedAt: null,
  wallClockStartedAt: null,
};

export type InterviewSessionAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" };

export function interviewSessionReducer(
  state: InterviewSessionClock,
  action: InterviewSessionAction,
): InterviewSessionClock {
  const now = Date.now();
  switch (action.type) {
    case "START":
      if (state.mode !== "idle") return state;
      return {
        mode: "running",
        accumulatedMs: 0,
        segmentStartedAt: now,
        wallClockStartedAt: now,
      };
    case "PAUSE":
      if (state.mode !== "running" || state.segmentStartedAt == null) return state;
      return {
        ...state,
        mode: "paused",
        accumulatedMs: state.accumulatedMs + (now - state.segmentStartedAt),
        segmentStartedAt: null,
      };
    case "RESUME":
      if (state.mode !== "paused") return state;
      return { ...state, mode: "running", segmentStartedAt: now };
    case "STOP":
      return initialInterviewSessionClock;
    default:
      return state;
  }
}

export function getInterviewSessionElapsedMs(state: InterviewSessionClock): number {
  if (state.mode === "idle") return 0;
  if (state.mode === "paused") return state.accumulatedMs;
  if (state.segmentStartedAt == null) return state.accumulatedMs;
  return state.accumulatedMs + (Date.now() - state.segmentStartedAt);
}
