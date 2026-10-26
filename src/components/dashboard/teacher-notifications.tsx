"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface TeacherNotification {
  id: string;
  type: "student_left" | "student_switched" | "student_joined";
  student_name: string | null;
  class_name: string | null;
  created_at: string;
  read_at: string | null;
}

const MESSAGES: Record<TeacherNotification["type"], string> = {
  student_left: "removed their class code and left",
  student_switched: "switched to a different class and left",
  student_joined: "joined",
};

/** Unread notices for the teacher, e.g. a student removed their class code. */
export function TeacherNotifications() {
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);

  const authHeaders = useCallback(async () => {
    const { data: { session } } = await createClient().auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : null;
  }, []);

  useEffect(() => {
    (async () => {
      const headers = await authHeaders();
      if (!headers) return;
      const res = await fetch("/api/notifications", { headers });
      if (!res.ok) return;
      const { notifications } = await res.json();
      setNotifications((notifications ?? []).filter((n: TeacherNotification) => !n.read_at));
    })();
  }, [authHeaders]);

  const dismiss = async () => {
    setNotifications([]);
    const headers = await authHeaders();
    if (headers) await fetch("/api/notifications", { method: "PATCH", headers });
  };

  if (notifications.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2 font-medium"><Bell className="h-4 w-4" /> Class updates</p>
          <ul className="space-y-1">
            {notifications.map((n) => (
              <li key={n.id}>
                <span className="font-medium">{n.student_name ?? "A student"}</span> {MESSAGES[n.type]}
                {n.class_name ? ` ${n.class_name}` : ""}
                <span className="text-muted-foreground"> · {new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button variant="outline" size="sm" onClick={dismiss}>Mark as read</Button>
      </div>
    </div>
  );
}
