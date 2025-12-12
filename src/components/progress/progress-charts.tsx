"use client"

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

const studyTimeData = [
  { subject: "Math", hours: 4 },
  { subject: "Science", hours: 2.5 },
  { subject: "History", hours: 1.5 },
  { subject: "English", hours: 2 },
  { subject: "Physics", hours: 3 },
];
const chartConfigTime = {
  hours: {
    label: "Hours",
    color: "hsl(var(--primary))",
  },
}

const proficiencyData = [
  { subject: "Algebra", score: 85, fullMark: 100 },
  { subject: "Biology", score: 92, fullMark: 100 },
  { subject: "Literature", score: 78, fullMark: 100 },
  { subject: "Physics", score: 70, fullMark: 100 },
  { subject: "History", score: 88, fullMark: 100 },
];
const chartConfigProficiency = {
  score: {
    label: "Score",
    color: "hsl(var(--accent))",
  },
}

const progressData = [
    { date: "Jan", score: 65 },
    { date: "Feb", score: 68 },
    { date: "Mar", score: 75 },
    { date: "Apr", score: 80 },
    { date: "May", score: 82 },
    { date: "Jun", score: 88 },
]
const chartConfigProgress = {
    score: {
        label: "Avg. Score",
        color: "hsl(var(--primary))",
    },
}

export default function ProgressCharts() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Time Spent Per Subject</CardTitle>
          <CardDescription>Hours studied in the last week.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigTime} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={studyTimeData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="subject"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Subject Proficiency</CardTitle>
          <CardDescription>Your current scores across different subjects.</CardDescription>
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
          <CardDescription>Your average score improvement over the last 6 months.</CardDescription>
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
