"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFocusTime, useFocus } from "@/components/focus-provider";

/** Small floating Focus Mode control, shown on every page except Focus Mode itself while a session is going. */
export function FocusMiniPlayer() {
  const pathname = usePathname();
  const { inSession, isActive, mode, timeLeft, currentTrack, toggleTimer, resetTimer } = useFocus();

  if (!inSession || pathname === "/focus") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-background/95 py-1.5 pl-3 pr-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Link href="/focus" className="flex items-center gap-2 text-sm" title="Open Focus Mode">
        <Headphones className={`h-4 w-4 ${isActive && mode === "focus" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <span className="font-mono font-semibold tabular-nums">{formatFocusTime(timeLeft)}</span>
        <span className="hidden sm:inline text-muted-foreground">
          {mode === "break" ? "Break" : currentTrack?.label ?? "Focus"}
        </span>
      </Link>
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={toggleTimer} title={isActive ? "Pause" : "Resume"}>
        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={resetTimer} title="Stop and reset">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
