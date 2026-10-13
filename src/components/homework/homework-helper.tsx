
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lightbulb, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getHomeworkHintsAction } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "../ad-placeholder";
import ModelSelector from "@/components/model-selector";
import { SupportedModel } from "@/ai/genkit";

const formSchema = z.object({
  problem: z.string().min(20, { message: "Please describe your problem in at least 20 characters." }),
  subject: z.string().min(1, { message: "Please select a subject." }),
  gradeLevel: z.string().min(1, { message: "Please select a grade level." }),
});

type FormValues = z.infer<typeof formSchema>;

interface HintsResult {
  hints: string[];
  guidance: string;
}

const subjects = ["Math", "Science", "History", "English", "Physics", "Chemistry", "Biology"];
const gradeLevels = ["Elementary", "Middle School", "High School", "University"];

export default function HomeworkHelper() {
  const [result, setResult] = useState<HintsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tier, hasTokens, consumeTokens, role, gradeLevel } = useAppState();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignment");
  const [assignmentTitle, setAssignmentTitle] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<SupportedModel>('haiku');
  const modelToUse = selectedModel;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problem: "",
      subject: "",
      gradeLevel: "",
    },
  });

  // Opened from My Assignments: fill in the assignment, subject and the student's grade level
  useEffect(() => {
    const grade = parseInt(gradeLevel ?? "", 10);
    const level = role === "college" ? "University"
      : grade >= 9 ? "High School" : grade >= 6 ? "Middle School" : grade >= 1 ? "Elementary" : "";
    if (level && !form.getValues("gradeLevel")) form.setValue("gradeLevel", level);
  }, [role, gradeLevel, form]);

  useEffect(() => {
    if (!assignmentId) return;
    (async () => {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/assignments?id=${encodeURIComponent(assignmentId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const assignment = (await res.json().catch(() => ({}))).data?.[0];
      if (!assignment) return;
      setAssignmentTitle(assignment.title);
      if (assignment.content_parsed) form.setValue("problem", assignment.content_parsed);
      const subject = subjects.find((s) => s.toLowerCase() === (assignment.subject ?? "").toLowerCase());
      if (subject) form.setValue("subject", subject);
    })();
  }, [assignmentId, form]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!hasTokens(modelToUse)) {
        setError("You have reached your monthly token limit. Please try again next month.");
        return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);

    const actionResult = await getHomeworkHintsAction({ ...data, model: modelToUse });

    if (actionResult.success) {
      consumeTokens(actionResult.data.totalTokens, modelToUse);
      setResult(actionResult.data);
    } else {
      setError(actionResult.error);
    }

    setIsLoading(false);
  };

  const isButtonDisabled = isLoading || !hasTokens(modelToUse);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Describe Your Problem</CardTitle>
        </CardHeader>
        <CardContent>
          {tier === 'free' && <AdPlaceholder className="mb-4" />}
          {assignmentTitle && (
            <p className="mb-4 rounded-md bg-primary/10 p-3 text-sm">
              Working on your assignment: <span className="font-medium">{assignmentTitle}</span>. Edit the text to focus on the part you&apos;re stuck on.
            </p>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="problem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., I'm trying to solve for x in the equation 2x + 5 = 15, but I'm not sure what the first step is."
                        rows={6}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a grade level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradeLevels.map((gl) => (
                            <SelectItem key={gl} value={gl}>{gl}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={isLoading} className="mt-2" />
              <Button type="submit" className="w-full" disabled={isButtonDisabled}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Get Hints"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI Generated Hints</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {!isLoading && !result && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Lightbulb className="h-12 w-12 mb-4" />
              <p>Your hints and guidance will appear here.</p>
            </div>
          )}
          {result && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Hints</h3>
                <Accordion type="single" collapsible className="w-full">
                  {result.hints.map((hint, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>Hint #{index + 1}</AccordionTrigger>
                      <AccordionContent>{hint}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              <div>
                <h3 className="font-semibold mb-2">General Guidance</h3>
                <p className="text-sm text-muted-foreground bg-secondary p-4 rounded-md">{result.guidance}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
