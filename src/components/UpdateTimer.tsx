import { useState, useEffect } from "react";

interface UpdateTimerProps {
  lastSnapshotAt: number;
}

export default function UpdateTimer({ lastSnapshotAt }: UpdateTimerProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (lastSnapshotAt === 0) return null;

  const elapsed = Math.floor((Date.now() - lastSnapshotAt) / 1000);

  return (
    <div className="rounded bg-gray-800/80 px-3 py-1.5 shadow-md backdrop-blur-sm">
      <span className="text-xs font-medium tabular-nums text-gray-400">
        Updated {elapsed}s ago
      </span>
    </div>
  );
}
