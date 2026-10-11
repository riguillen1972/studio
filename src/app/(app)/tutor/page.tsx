"use client";

import AITutor from "@/components/dashboard/ai-tutor";
import { ErrorBoundary } from "@/components/error-boundary";

// Teachers' dashboard shows their classes, so the AI Tutor gets its own page for them
export default function TutorPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">AI Tutor</h1>
        <p className="text-muted-foreground mt-1">Ask a question or describe a concept you want to understand better.</p>
      </header>
      <ErrorBoundary fallbackTitle="AI Tutor encountered an error">
        <AITutor />
      </ErrorBoundary>
    </div>
  );
}
