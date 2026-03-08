interface AircraftCountProps {
  count: number;
}

export default function AircraftCount({ count }: AircraftCountProps) {
  return (
    <div className="rounded bg-gray-800/80 px-3 py-1.5 shadow-md backdrop-blur-sm">
      <span className="text-sm font-medium tabular-nums text-gray-200">
        {count.toLocaleString()} aircraft
      </span>
    </div>
  );
}
