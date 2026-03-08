import ProgressCharts from "@/components/progress/progress-charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, Clock, BookCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stats = [
    {
        title: "Subjects Mastered",
        value: "4",
        icon: BookCheck,
    },
    {
        title: "Time Spent (Last Week)",
        value: "8.5 hours",
        icon: Clock,
    },
    {
        title: "Current Goal Progress",
        value: "75%",
        icon: Target,
    }
]

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Your Progress
        </h1>
        <p className="text-muted-foreground mt-1">
          An overview of your learning journey and achievements.
        </p>
        <Badge variant="outline" className="mt-2">Demo Data</Badge>
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
      <ProgressCharts />
    </div>
  );
}
