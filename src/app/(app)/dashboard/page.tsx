"use client";

import AITutor from "@/components/dashboard/ai-tutor";
import { useAuth } from "@/lib/supabase/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";

function getRoleGreeting(user: any): { title: string; subtitle: string } {
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student';
  const role = user?.user_metadata?.role;
  const careerField = user?.user_metadata?.career_field;

  if (role === 'teacher') {
    return {
      title: `Welcome back, ${displayName}!`,
      subtitle: 'Monitor your students and manage your class.',
    };
  }
  if (role === 'college' && careerField) {
    return {
      title: `Welcome back, ${displayName}!`,
      subtitle: `AI optimized for your ${careerField} studies. Ask the AI Tutor anything.`,
    };
  }
  return {
    title: `Welcome back, ${displayName}!`,
    subtitle: 'Ready to learn something new? Ask the AI Tutor anything.',
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { title, subtitle } = getRoleGreeting(user);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {subtitle}
        </p>
      </header>
      <ErrorBoundary fallbackTitle="AI Tutor encountered an error">
        <AITutor />
      </ErrorBoundary>
    </div>
  );
}
