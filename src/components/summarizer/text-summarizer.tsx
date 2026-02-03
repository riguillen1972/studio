
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getSummaryAction } from "@/lib/actions";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "../ad-placeholder";

const formSchema = z.object({
  text: z.string().min(100, { message: "Please enter at least 100 characters to summarize." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function TextSummarizer() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tier, hasTokens, consumeTokens } = useAppState();
  const modelToUse = tier !== 'free' ? 'pro' : 'flash';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!hasTokens(modelToUse)) {
        setError("You have reached your monthly token limit. Please try again next month.");
        return;
    }
    setIsLoading(true);
    setSummary(null);
    setError(null);
    
    const actionResult = await getSummaryAction({ ...data, model: modelToUse });

    if (actionResult.success) {
      consumeTokens(actionResult.data.totalTokens, modelToUse);
      setSummary(actionResult.data.summary);
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
          <CardTitle className="font-headline">Text to Summarize</CardTitle>
          <CardDescription>Paste the text you want to understand better.</CardDescription>
        </CardHeader>
        <CardContent>
          {tier === 'free' && <AdPlaceholder className="mb-4" />}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your text here..."
                        rows={15}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isButtonDisabled}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Summarize"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Summary</CardTitle>
           <CardDescription>The key concepts from your text.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {!isLoading && !summary && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <ScrollText className="h-12 w-12 mb-4" />
              <p>Your summary will appear here.</p>
            </div>
          )}
          {summary && (
            <div className="space-y-4 text-sm text-foreground/90 whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
