import { useState, useEffect } from "react";
import type { AircraftLive } from "../types/aircraft";

export type WsState = "LIVE" | "RECONNECTING" | "OFFLINE" | "DISCONNECTED";

interface WsResult {
  state: WsState;
  data: AircraftLive[];
  ts: number;
}

export function useWebSocket(url: string, enabled = true): WsResult {
  const [state, setState] = useState<WsState>(enabled ? "RECONNECTING" : "DISCONNECTED");
  const [data, setData] = useState<AircraftLive[]>([]);
  const [ts, setTs] = useState<number>(0);

  useEffect(() => {
    if (!enabled) {
      setState("DISCONNECTED");
      return;
    }

    let ws: WebSocket;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;

    function connect() {
      if (closed) return;
      ws = new WebSocket(url);

      ws.onopen = () => {
        setState("LIVE");
        attempt = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "snapshot") {
            setData(msg.aircraft);
            setTs(msg.ts);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (closed) return;
        if (attempt > 10) {
          setState("OFFLINE");
        } else {
          setState("RECONNECTING");
        }
        const delay =
          Math.min(1000 * 2 ** attempt, 30000) + Math.random() * 500;
        timer = setTimeout(connect, delay);
        attempt++;
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      closed = true;
      clearTimeout(timer);
      ws.close();
    };
  }, [url, enabled]);

  return { state, data, ts };
}
