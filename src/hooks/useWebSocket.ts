import { useState, useEffect, useRef, useCallback } from "react";
import type { AircraftLive } from "../types/aircraft";
import { API_URL, POLL_INTERVAL } from "../lib/constants";

export type WsState = "LIVE" | "RECONNECTING" | "OFFLINE" | "DISCONNECTED";

interface WsResult {
  state: WsState;
  data: AircraftLive[];
  ts: number;
}

/**
 * HTTP polling replacement for WebSocket.
 * Polls /api/aircraft/live every POLL_INTERVAL ms.
 * Keeps the same interface (WsState, data, ts) so the rest of the app is unchanged.
 */
export function useWebSocket(_url: string, enabled = true): WsResult {
  const [state, setState] = useState<WsState>(enabled ? "RECONNECTING" : "DISCONNECTED");
  const [data, setData] = useState<AircraftLive[]>([]);
  const [ts, setTs] = useState<number>(0);
  const consecutiveErrors = useRef(0);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/aircraft/live`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const aircraft: AircraftLive[] = await res.json();
      setData(aircraft);
      setTs(Date.now() / 1000);
      setState("LIVE");
      consecutiveErrors.current = 0;
    } catch {
      consecutiveErrors.current++;
      if (consecutiveErrors.current > 5) {
        setState("OFFLINE");
      } else {
        setState("RECONNECTING");
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState("DISCONNECTED");
      return;
    }

    // Initial fetch
    poll();

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [enabled, poll]);

  return { state, data, ts };
}
