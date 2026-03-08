"use client";

import AITutor from "@/components/dashboard/ai-tutor";
import { useAuth } from "@/lib/supabase/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          Welcome back, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to learn something new? Ask the AI Tutor anything.
        </p>
      </header>
      <ErrorBoundary fallbackTitle="AI Tutor encountered an error">
        <AITutor />
      </ErrorBoundary>
    </div>
  );
}
