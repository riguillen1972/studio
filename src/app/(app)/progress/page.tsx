"use client";

import { useEffect, useState } from "react";
import ProgressCharts from "@/components/progress/progress-charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, Clock, BookCheck } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizResult {
  id: string;
  topic: string;
  subject: string;
  score: number;
  total: number;
  created_at: string;
}

export default function ProgressPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadProgress = async () => {
      const { data } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (data) setResults(data);
      setIsLoading(false);
    };
    loadProgress();
  }, [user, supabase]);

  const subjectsMastered = new Set(
    results.filter(r => r.score / r.total >= 0.8).map(r => r.subject)
  ).size;

  const totalQuizzes = results.length;
  const avgScore = totalQuizzes > 0 
    ? Math.round(results.reduce((acc, r) => acc + (r.score / r.total), 0) / totalQuizzes * 100) 
    : 0;

  const stats = [
    {
      title: "Subjects Mastered (80%+)",
      value: isLoading ? <Skeleton className="h-8 w-16" /> : subjectsMastered.toString(),
      icon: BookCheck,
    },
    {
      title: "Quizzes Completed",
      value: isLoading ? <Skeleton className="h-8 w-16" /> : totalQuizzes.toString(),
      icon: Clock,
    },
    {
      title: "Average Score",
      value: isLoading ? <Skeleton className="h-8 w-16" /> : `${avgScore}%`,
      icon: Target,
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          Your Progress
        </h1>
        <p className="text-muted-foreground mt-1">
          An overview of your learning journey and achievements based on quiz results.
        </p>
      </header>
       <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>
      {!isLoading && <ProgressCharts quizResults={results} />}
    </div>
  );
}
