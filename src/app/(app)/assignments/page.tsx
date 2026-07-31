"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useAppState } from "@/components/app-state-provider";
import { ChevronRight, Folder, CheckCircle2, Loader2, BookDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { classCode } = useAppState();
  const supabase = createClient();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssignments() {
      if (!classCode) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Get class by join_code
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id, name')
          .eq('join_code', classCode)
          .maybeSingle();

        if (classError) throw classError;
        if (!classData) {
          setIsLoading(false);
          return; // No class found
        }

        // 2. Get active context packs (assignments)
        const { data: packs, error: packsError } = await supabase
          .from('context_packs')
          .select('*')
          .eq('class_id', classData.id)
          .in('type', ['homework', 'quiz'])
          .eq('status', 'active');

        if (packsError) throw packsError;

        // 3. Attach class name to each pack
        const enrichedPacks = (packs || []).map(p => ({
          ...p,
          className: classData.name
        }));

        setAssignments(enrichedPacks);
      } catch (e: any) {
        console.error("Error loading assignments:", e);
        setError("Failed to load assignments.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAssignments();
  }, [classCode, supabase]);

  const getColorForType = (type: string) => {
    switch (type) {
      case "homework": return "bg-purple-500/20 text-purple-600";
      case "quiz": return "bg-pink-500/20 text-pink-600";
      default: return "bg-gray-500/20 text-gray-600";
    }
  };

  const getRouteForType = (type: string) => {
    if (type === "quiz") return "/quiz";
    return "/homework";
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
          <BookDashed className="w-8 h-8 text-primary" />
          My Assignments
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete work assigned by your teachers.
        </p>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
          <CheckCircle2 className="w-16 h-16 text-green-500/80 mb-4" />
          <h3 className="text-xl font-medium text-foreground">You&apos;re all caught up!</h3>
          <p className="text-sm mt-2">No active assignments from your teachers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(assignment => (
            <Card 
              key={assignment.id} 
              className="hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => {
                // Log start of activity
                if (user) {
                  supabase.from('study_tool_usage').insert({
                    user_id: user.id,
                    tool_id: assignment.type === 'quiz' ? 'examOracle' : 'feynmanMode',
                    class_id: assignment.class_id,
                    context_pack_id: assignment.id,
                    input_summary: "Started Assignment"
                  }).then(() => {
                     router.push(getRouteForType(assignment.type));
                  });
                } else {
                   router.push(getRouteForType(assignment.type));
                }
              }}
            >
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={`uppercase font-bold tracking-wider ${getColorForType(assignment.type)} border-none`}>
                    {assignment.type}
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                
                <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                  {assignment.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
                  <Folder className="w-4 h-4" />
                  <span>{assignment.className}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
