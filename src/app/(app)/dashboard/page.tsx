"use client";

import AITutor from "@/components/dashboard/ai-tutor";
import { useUser } from "@/firebase";

export default function DashboardPage() {
  const { user } = useUser();
  const displayName = user?.displayName || 'Student';

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Welcome back, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to learn something new? Ask the AI Tutor anything.
        </p>
      </header>
      <AITutor />
    </div>
  );
}
