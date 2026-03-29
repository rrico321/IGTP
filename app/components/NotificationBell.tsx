"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

interface MachineStatus {
  id: string;
  status: string;
  online: boolean;
  lastHeartbeatAt: string | null;
}

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    function connect() {
      const es = new EventSource("/api/sse");
      esRef.current = es;

      es.addEventListener("notifications", (e) => {
        const data = JSON.parse(e.data) as { unreadCount: number };
        setUnread(data.unreadCount);
      });

      // Reconnect on error (EventSource stops after error by default)
      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000);
      };
    }

    connect();
    return () => esRef.current?.close();
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
    >
      <Bell className="w-4 h-4 text-muted-foreground" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

// Used by the machines page to show live online/offline indicators
export function useMachineStatuses() {
  const [statuses, setStatuses] = useState<Map<string, MachineStatus>>(new Map());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    function connect() {
      const es = new EventSource("/api/sse");
      esRef.current = es;

      es.addEventListener("machines", (e) => {
        const list = JSON.parse(e.data) as MachineStatus[];
        setStatuses(new Map(list.map((m) => [m.id, m])));
      });

      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000);
      };
    }

    connect();
    return () => esRef.current?.close();
  }, []);

  return statuses;
}
