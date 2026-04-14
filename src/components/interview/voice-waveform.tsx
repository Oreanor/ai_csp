const BAR_HEIGHTS = [10, 18, 28, 20, 34, 22, 30, 16, 12];

export function VoiceWaveform() {
  return (
    <div className="mx-auto mt-6 flex h-12 items-center justify-center gap-1.5">
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-1.5 rounded-full bg-brand"
          style={{ height }}
        />
      ))}
    </div>
  );
}
