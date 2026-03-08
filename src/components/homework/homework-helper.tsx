
"use client";

import { useState } from "react";
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
  const { tier, hasTokens, consumeTokens } = useAppState();
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
