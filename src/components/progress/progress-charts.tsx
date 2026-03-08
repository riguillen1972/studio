"use client"

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface QuizResult {
  id: string;
  topic: string;
  subject: string;
  score: number;
  total: number;
  created_at: string;
}

interface ProgressChartsProps {
  quizResults: QuizResult[];
}

const chartConfigTime = {
  quizzes: {
    label: "Quizzes",
    color: "hsl(var(--primary))",
  },
}

const chartConfigProficiency = {
  score: {
    label: "Score",
    color: "hsl(var(--accent))",
  },
}

const chartConfigProgress = {
  score: {
    label: "Avg. Score",
    color: "hsl(var(--primary))",
  },
}

export default function ProgressCharts({ quizResults }: ProgressChartsProps) {
  // 1. Quizzes per subject
  const quizzesPerSubject = useMemo(() => {
    const counts: Record<string, number> = {};
    quizResults.forEach(r => {
      const subject = r.subject || "General";
      counts[subject] = (counts[subject] || 0) + 1;
    });
    return Object.entries(counts).map(([subject, count]) => ({
      subject,
      quizzes: count
    }));
  }, [quizResults]);

  // 2. Proficiency (avg score per subject)
  const proficiencyData = useMemo(() => {
    const sums: Record<string, { score: number; total: number }> = {};
    quizResults.forEach(r => {
      const subject = r.subject || "General";
      if (!sums[subject]) sums[subject] = { score: 0, total: 0 };
      sums[subject].score += (r.score / r.total) * 100;
      sums[subject].total += 1;
    });
    return Object.entries(sums).map(([subject, data]) => ({
      subject,
      score: Math.round(data.score / data.total),
      fullMark: 100
    }));
  }, [quizResults]);

  // 3. Progress over time (avg score by month)
  const progressData = useMemo(() => {
    const months: Record<string, { score: number; count: number }> = {};
    quizResults.forEach(r => {
      const date = new Date(r.created_at);
      const monthStr = date.toLocaleString('default', { month: 'short' });
      if (!months[monthStr]) months[monthStr] = { score: 0, count: 0 };
      months[monthStr].score += (r.score / r.total) * 100;
      months[monthStr].count += 1;
    });
    
    // Sort array by actual month order if needed, but for simplicity we rely on chronological DB order
    const result = [];
    for (const [date, data] of Object.entries(months)) {
      result.push({
        date,
        score: Math.round(data.score / data.count)
      });
    }
    return result;
  }, [quizResults]);

  if (quizResults.length === 0) {
    return (
      <div className="grid gap-8 md:grid-cols-1">
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
            <h3 className="text-lg font-semibold mb-2">No quiz data yet</h3>
            <p>Take some quizzes with the AI Tutor to see your progress charts!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Engagement Per Subject</CardTitle>
          <CardDescription>Number of quizzes taken by subject.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigTime} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={quizzesPerSubject}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="subject"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="quizzes" fill="var(--color-quizzes)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Subject Proficiency</CardTitle>
          <CardDescription>Average scores across different subjects.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigProficiency} className="h-[250px] w-full">
            <RadarChart data={proficiencyData}>
              <CartesianGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarGrid />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                dataKey="score"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">Progress Over Time</CardTitle>
          <CardDescription>Your average score trend based on quiz results.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigProgress} className="h-[250px] w-full">
            <LineChart accessibilityLayer data={progressData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="score"
                type="monotone"
                stroke="var(--color-score)"
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
