import { cn } from "@/lib/utils";

const BAR_HEIGHTS = [5, 9, 12, 8, 14, 10, 13, 7, 6];

type VoiceWaveformProps = {
  /** When true, bars use a simple staggered pulse so playback / activity is obvious. */
  active?: boolean;
  className?: string;
};

export function VoiceWaveform({ active = false, className }: VoiceWaveformProps) {
  return (
    <div
      className={cn(
        "flex h-6 w-fit shrink-0 items-end justify-end gap-0.5 self-end",
        className,
      )}
      aria-hidden
    >
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`voice-waveform-bar w-0.5 rounded-full bg-muted-foreground/25 ${active ? "voice-waveform-bar--active" : ""}`}
          style={{
            height,
            animationDelay: active ? `${index * 65}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
