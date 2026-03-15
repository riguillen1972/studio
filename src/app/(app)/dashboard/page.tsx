"use client";

import AITutor from "@/components/dashboard/ai-tutor";
import { useAuth } from "@/lib/supabase/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "@/components/ad-placeholder";

import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";

function getRoleGreeting(user: any): { title: string; subtitle: string; role: string } {
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student';
  const role = user?.user_metadata?.role || 'student';
  const careerField = user?.user_metadata?.career_field;

  if (role === 'teacher') {
    return {
      title: `Welcome back, ${displayName}!`,
      subtitle: 'Monitor your students and manage your class instructions below.',
      role,
    };
  }
  if (role === 'college' && careerField) {
    return {
      title: `Welcome back, ${displayName}!`,
      subtitle: `AI optimized for your ${careerField} studies. Ask the AI Tutor anything.`,
      role,
    };
  }
  return {
    title: `Welcome back, ${displayName}!`,
    subtitle: 'Ready to learn something new? Ask the AI Tutor anything.',
    role,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tier } = useAppState();
  const { title, subtitle, role } = getRoleGreeting(user);
  const careerField = user?.user_metadata?.career_field;

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {subtitle}
        </p>
      </header>

      {tier === 'free' && <AdPlaceholder />}

      {role === 'teacher' ? (
        <TeacherDashboard user={user} />
      ) : (
        <ErrorBoundary fallbackTitle="AI Tutor encountered an error">
          <AITutor careerField={careerField} />
        </ErrorBoundary>
      )}
    </div>
  );
}
