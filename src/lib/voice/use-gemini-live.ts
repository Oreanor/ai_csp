"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import type { Session } from "@google/genai";

const LIVE_MODEL = "gemini-2.5-flash-native-audio-latest";
const MIC_RATE = 16000;
const OUT_RATE = 24000;
const MIC_BUFFER = 4096;

export type LiveStatus = "idle" | "connecting" | "live" | "error";

function float32ToPcm16Base64(f32: Float32Array<ArrayBufferLike>): string {
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    i16[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767)));
  }
  const bytes = new Uint8Array(i16.buffer);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function pcm16Base64ToFloat32(b64: string): Float32Array<ArrayBuffer> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
  return f32;
}

export type UseGeminiLiveOptions = {
  systemPrompt: string;
  onTranscript?: (text: string, role: "user" | "model") => void;
  onSpeakingChange?: (speaking: boolean) => void;
};

export function useGeminiLive({
  systemPrompt,
  onTranscript,
  onSpeakingChange,
}: UseGeminiLiveOptions) {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const statusRef = useRef<LiveStatus>("idle");
  const micCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micProcRef = useRef<ScriptProcessorNode | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const nextTimeRef = useRef(0);
  const playingRef = useRef<AudioBufferSourceNode[]>([]);
  const inBufRef = useRef("");
  const outBufRef = useRef("");
  const isMountedRef = useRef(true);

  const onTranscriptRef = useRef(onTranscript);
  const onSpeakingChangeRef = useRef(onSpeakingChange);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onSpeakingChangeRef.current = onSpeakingChange; }, [onSpeakingChange]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const updateStatus = useCallback((s: LiveStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const stopMic = useCallback(() => {
    micProcRef.current?.disconnect();
    micProcRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    void micCtxRef.current?.close().catch(() => {});
    micCtxRef.current = null;
  }, []);

  const clearPlayback = useCallback(() => {
    for (const src of playingRef.current) {
      try { src.stop(0); } catch { /* already stopped */ }
    }
    playingRef.current = [];
    nextTimeRef.current = 0;
    onSpeakingChangeRef.current?.(false);
  }, []);

  const enqueueAudio = useCallback((base64: string) => {
    const ctx = playCtxRef.current;
    if (!ctx || !base64) return;
    const f32 = pcm16Base64ToFloat32(base64);
    if (!f32.length) return;
    const buf = ctx.createBuffer(1, f32.length, OUT_RATE);
    buf.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    const start = Math.max(now + 0.005, nextTimeRef.current);
    src.start(start);
    nextTimeRef.current = start + buf.duration;
    playingRef.current.push(src);
    onSpeakingChangeRef.current?.(true);
    src.onended = () => {
      playingRef.current = playingRef.current.filter((s) => s !== src);
      if (!playingRef.current.length) onSpeakingChangeRef.current?.(false);
    };
  }, []);

  const connect = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      updateStatus("error");
      setError("Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local");
      return;
    }

    updateStatus("connecting");
    setError(null);

    try {
      playCtxRef.current = new AudioContext({ sampleRate: OUT_RATE });
      await playCtxRef.current.resume();
      nextTimeRef.current = 0;

      const micCtx = new AudioContext({ sampleRate: MIC_RATE });
      await micCtx.resume();
      micCtxRef.current = micCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey });

      const session = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemPrompt,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          temperature: 0.7,
        },
        callbacks: {
          onopen: () => {
            if (!isMountedRef.current) return;
            updateStatus("live");

            const source = micCtx.createMediaStreamSource(stream);
            const proc = micCtx.createScriptProcessor(MIC_BUFFER, 1, 1);
            micProcRef.current = proc;

            proc.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const data = float32ToPcm16Base64(e.inputBuffer.getChannelData(0));
              sessionRef.current.sendRealtimeInput({
                audio: { data, mimeType: `audio/pcm;rate=${MIC_RATE}` },
              });
            };

            const silentGain = micCtx.createGain();
            silentGain.gain.value = 0;
            source.connect(proc);
            proc.connect(silentGain);
            silentGain.connect(micCtx.destination);
          },

          onmessage: (msg) => {
            if (!isMountedRef.current) return;
            const sc = msg.serverContent;
            if (!sc) return;

            for (const part of sc.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) enqueueAudio(part.inlineData.data);
            }

            if (sc.inputTranscription?.text) inBufRef.current += sc.inputTranscription.text;
            if (sc.inputTranscription?.finished && inBufRef.current.trim()) {
              onTranscriptRef.current?.(inBufRef.current.trim(), "user");
              inBufRef.current = "";
            }

            if (sc.outputTranscription?.text) outBufRef.current += sc.outputTranscription.text;
            if (sc.outputTranscription?.finished && outBufRef.current.trim()) {
              onTranscriptRef.current?.(outBufRef.current.trim(), "model");
              outBufRef.current = "";
            }

            if (sc.turnComplete) {
              if (inBufRef.current.trim()) {
                onTranscriptRef.current?.(inBufRef.current.trim(), "user");
                inBufRef.current = "";
              }
              if (outBufRef.current.trim()) {
                onTranscriptRef.current?.(outBufRef.current.trim(), "model");
                outBufRef.current = "";
              }
            }

            if (sc.interrupted) clearPlayback();
          },

          onerror: (e) => {
            if (!isMountedRef.current) return;
            console.error("[Gemini Live] WebSocket error:", e);
            const msg = (e.message && e.message !== "error") ? e.message : "WebSocket error";
            updateStatus("error");
            setError(msg);
            stopMic();
            clearPlayback();
          },

          onclose: (e) => {
            if (!isMountedRef.current) return;
            console.info("[Gemini Live] closed — code:", e.code, "reason:", e.reason || "(none)");
            const wasError = statusRef.current === "error";
            stopMic();
            clearPlayback();
            void playCtxRef.current?.close().catch(() => {});
            playCtxRef.current = null;
            if (wasError) return; // preserve error message — don't reset to idle
            if (statusRef.current === "idle") return;
            if (e.code !== 1000 && e.code !== 1001) {
              const reason = e.reason?.trim() || `Connection closed (code ${e.code})`;
              updateStatus("error");
              setError(reason);
            } else {
              updateStatus("idle");
            }
          },
        },
      });

      sessionRef.current = session;
    } catch (e) {
      const isPermission = e instanceof DOMException && e.name === "NotAllowedError";
      const msg = isPermission
        ? "Microphone access denied"
        : e instanceof Error
          ? e.message
          : "Failed to connect";
      updateStatus("error");
      setError(msg);
      stopMic();
      clearPlayback();
      void playCtxRef.current?.close().catch(() => {});
      playCtxRef.current = null;
    }
  }, [systemPrompt, updateStatus, stopMic, clearPlayback, enqueueAudio]);

  const disconnect = useCallback(() => {
    try { sessionRef.current?.close(); } catch { /* ignore */ }
    sessionRef.current = null;
    inBufRef.current = "";
    outBufRef.current = "";
    stopMic();
    clearPlayback();
    void playCtxRef.current?.close().catch(() => {});
    playCtxRef.current = null;
    updateStatus("idle");
    setError(null);
  }, [stopMic, clearPlayback, updateStatus]);

  const sendText = useCallback((text: string) => {
    const s = sessionRef.current;
    if (!s) return;
    s.sendClientContent({
      turns: [{ role: "user", parts: [{ text }] }],
      turnComplete: true,
    });
    onTranscriptRef.current?.(text, "user");
  }, []);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      try { sessionRef.current?.close(); } catch { /* ignore */ }
      sessionRef.current = null;
      stopMic();
      clearPlayback();
      void playCtxRef.current?.close().catch(() => {});
    },
    [stopMic, clearPlayback],
  );

  return { status, error, connect, disconnect, sendText };
}
