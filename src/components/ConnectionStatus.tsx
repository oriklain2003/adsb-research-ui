import type { WsState } from "../hooks/useWebSocket";

interface ConnectionStatusProps {
  state: WsState;
  liveEnabled: boolean;
  onToggle: () => void;
}

const STATUS_CONFIG: Record<
  WsState,
  { dotClass: string; textClass: string; label: string }
> = {
  LIVE: {
    dotClass: "bg-green-400",
    textClass: "text-green-400",
    label: "LIVE",
  },
  RECONNECTING: {
    dotClass: "bg-amber-400 animate-pulse",
    textClass: "text-amber-400",
    label: "RECONNECTING",
  },
  OFFLINE: {
    dotClass: "bg-red-400",
    textClass: "text-red-400",
    label: "OFFLINE",
  },
  DISCONNECTED: {
    dotClass: "bg-gray-500",
    textClass: "text-gray-400",
    label: "DISCONNECTED",
  },
};

export default function ConnectionStatus({ state, liveEnabled, onToggle }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[state];

  return (
    <button
      onClick={onToggle}
      className="rounded bg-gray-800/80 px-3 py-1.5 shadow-md backdrop-blur-sm hover:bg-gray-700/80 transition-colors text-left"
      title={liveEnabled ? "Click to disconnect from live feed" : "Click to reconnect to live feed"}
    >
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${config.dotClass}`} />
        <span
          className={`text-xs font-medium tracking-wider ${config.textClass}`}
        >
          {config.label}
        </span>
      </div>
    </button>
  );
}
