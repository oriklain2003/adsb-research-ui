interface JammingHourSliderProps {
  hours: string[];
  selectedHour: string | null;
  onSelectHour: (hour: string) => void;
}

export default function JammingHourSlider({
  hours,
  selectedHour,
  onSelectHour,
}: JammingHourSliderProps) {
  if (hours.length === 0) return null;

  const currentIndex = selectedHour
    ? hours.indexOf(selectedHour)
    : 0;

  const stepBack = () => {
    if (currentIndex > 0) onSelectHour(hours[currentIndex - 1]);
  };
  const stepForward = () => {
    if (currentIndex < hours.length - 1) onSelectHour(hours[currentIndex + 1]);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 bg-gray-800/90 backdrop-blur-sm rounded border border-gray-700/50 px-3 py-2 flex items-center gap-2">
      <button
        onClick={stepBack}
        disabled={currentIndex <= 0}
        className="text-gray-300 hover:text-white disabled:text-gray-600 text-sm px-1 transition-colors"
        aria-label="Previous hour"
      >
        {"\u25C0"}
      </button>

      <input
        type="range"
        min={0}
        max={hours.length - 1}
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(e) => onSelectHour(hours[Number(e.target.value)])}
        className="w-48 accent-yellow-400"
      />

      <button
        onClick={stepForward}
        disabled={currentIndex >= hours.length - 1}
        className="text-gray-300 hover:text-white disabled:text-gray-600 text-sm px-1 transition-colors"
        aria-label="Next hour"
      >
        {"\u25B6"}
      </button>

      <span className="text-[10px] text-gray-400 whitespace-nowrap min-w-[100px] text-center">
        {selectedHour
          ? new Date(selectedHour).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "\u2014"}
      </span>

      <span className="text-[10px] text-gray-500">
        {currentIndex + 1}/{hours.length}
      </span>
    </div>
  );
}
