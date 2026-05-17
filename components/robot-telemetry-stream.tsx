"use client";

import { useEffect, useMemo, useState } from "react";
import { Wifi, WifiOff, Loader2, Bot, Battery } from "lucide-react";

interface TelemetryPayload {
  state?: string;
  status?: string;
  battery_level?: number;
  current_track_index?: number;
  last_active?: string;
  [key: string]: unknown;
}

interface RobotTelemetryStreamProps {
  robotId: string;
  nodeRedBaseUrl: string;
  initialTelemetry: TelemetryPayload | null;
}

function toWebSocketUrl(baseUrl: string): string | null {
  if (!baseUrl.trim()) {
    return null;
  }

  try {
    const url = new URL(baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/telemetry";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function RobotTelemetryStream({ robotId, nodeRedBaseUrl, initialTelemetry }: RobotTelemetryStreamProps) {
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(() => initialTelemetry);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const websocketUrl = useMemo(() => toWebSocketUrl(nodeRedBaseUrl), [nodeRedBaseUrl]);

  useEffect(() => {
    setTelemetry(initialTelemetry);
  }, [robotId, initialTelemetry]);

  useEffect(() => {
    if (!websocketUrl) {
      setConnectionState("disconnected");
      return;
    }

    let isMounted = true;
    const socket = new WebSocket(websocketUrl);

    setConnectionState("connecting");

    socket.onopen = () => {
      if (!isMounted) return;
      setConnectionState("connected");
      socket.send(JSON.stringify({ action: "subscribe", target: robotId }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TelemetryPayload;
        if (isMounted) {
          setTelemetry(data);
        }
      } catch {
        // Ignore malformed messages from the websocket stream.
      }
    };

    socket.onerror = () => {
      if (!isMounted) return;
      setConnectionState("disconnected");
    };

    socket.onclose = () => {
      if (!isMounted) return;
      setConnectionState("disconnected");
    };

    return () => {
      isMounted = false;
      socket.close();
    };
  }, [robotId, websocketUrl]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#0E6633]" /> Live Telemetry
          </h3>
          <p className="text-xs text-[#757575] mt-1">WebSocket: {websocketUrl ?? "not configured"}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          {connectionState === "connected" ? (
            <>
              <Wifi className="w-4 h-4 text-[#22a042]" /> Connected
            </>
          ) : connectionState === "connecting" ? (
            <>
              <Loader2 className="w-4 h-4 text-[#0E6633] animate-spin" /> Connecting
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" /> Disconnected
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">State</p>
          <p className="text-sm font-black text-[#1e1e1e] mt-1">{telemetry?.state || "Waiting for data"}</p>
        </div>
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
          <p className="text-sm font-black text-[#1e1e1e] mt-1">{telemetry?.status || "Waiting for data"}</p>
        </div>
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Battery</p>
          <div className="flex items-center gap-2 mt-1">
            <Battery className="w-4 h-4 text-[#0E6633]" />
            <p className="text-sm font-black text-[#1e1e1e]">{telemetry?.battery_level ?? 0}%</p>
          </div>
        </div>
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Track</p>
          <p className="text-sm font-black text-[#1e1e1e] mt-1">
            {telemetry?.current_track_index ?? "-"}
          </p>
        </div>
      </div>
    </div>
  );
}