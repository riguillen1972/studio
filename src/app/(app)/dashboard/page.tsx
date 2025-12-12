import AITutor from "@/components/dashboard/ai-tutor";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Welcome back, Student!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to learn something new? Ask the AI Tutor anything.
        </p>
      </header>
      <AITutor />
    </div>
  );
}
