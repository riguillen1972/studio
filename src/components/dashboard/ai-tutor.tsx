"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Loader2, Sparkles, User, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { getExplanationAction } from "@/lib/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "@/components/ad-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SupportedModel } from "@/ai/genkit";

const formSchema = z.object({
  concept: z.string().min(10, { message: "Please enter a concept or question with at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

interface ConversationTurn {
  role: "user" | "ai";
  content: string;
}

export default function AITutor({ careerField }: { careerField?: string }) {
  const [isClient, setIsClient] = useState(false);
  const { tier, hasTokens, consumeTokens } = useAppState();
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<SupportedModel>('flash');
  const [mode, setMode] = useState<'help' | 'research'>('help');
  
  useEffect(() => {
    setIsClient(true);
    // Ensure the selected model is allowed on load
    if (tier === 'free' && selectedModel !== 'flash') {
      setSelectedModel('flash');
    } else if (tier === 'pro' && selectedModel === 'haiku') {
      setSelectedModel('flash'); // Pro doesn't have haiku
    }
  }, [tier, selectedModel]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concept: "",
    },
  });
  
  const modelToUse = selectedModel;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!hasTokens(modelToUse)) {
        setConversation((prev) => [...prev, { role: "ai", content: `You have reached your monthly token limit for the ${modelToUse === 'flash' ? 'Gemini 2.5 Flash' : modelToUse === 'pro' ? 'Gemini 2.5 Pro' : 'Claude 3.5 Haiku'} model. Please try again next month.` }]);
        return;
    }
    setIsLoading(true);
    setConversation((prev) => [...prev, { role: "user", content: data.concept }]);

    const result = await getExplanationAction({ concept: data.concept, model: modelToUse, careerField, conversationHistory: conversation, mode });

    if (result.success) {
      consumeTokens(result.data.totalTokens, modelToUse);
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: result.data.explanation },
      ]);
      form.reset();
    } else {
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: `Error: ${result.error}` },
      ]);
    }

    setIsLoading(false);
  };

  const isButtonDisabled = isLoading || (isClient && !hasTokens(modelToUse));

  if (!isClient) {
    return (
        <Card className="h-full flex flex-col max-h-[75vh]">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Sparkles className="text-primary"/>
                    AI Tutor
                    {careerField && <Badge variant="secondary" className="ml-2 font-sans font-normal">Optimized for {careerField}</Badge>}
                </CardTitle>
                <CardDescription>
                    Ask a question or describe a concept you want to understand better.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                <Skeleton className="h-full w-full" />
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <div className="flex w-full items-start gap-2">
                    <Skeleton className="h-10 flex-grow" />
                    <Skeleton className="h-10 w-16" />
                </div>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col max-h-[75vh]">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Sparkles className="text-primary"/>
                AI Tutor
                {careerField && <Badge variant="secondary" className="ml-2 font-sans font-normal">Optimized for {careerField}</Badge>}
            </CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                  Ask a question or describe a concept you want to understand better.
              </CardDescription>
              {conversation.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 shrink-0" onClick={() => setConversation([])}>
                  <Trash2 className="h-3 w-3" /> New Chat
                </Button>
              )}
            </div>
        </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        {tier === 'free' && <AdPlaceholder />}
        <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="space-y-6">
            {conversation.length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                    <Bot className="mx-auto h-12 w-12 mb-4"/>
                    <p>Your conversation will appear here.</p>
                </div>
            )}
            {conversation.map((turn, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  turn.role === "ai" ? "" : "justify-end"
                }`}
              >
                {turn.role === "ai" && (
                    <Avatar className="w-8 h-8 border-2 border-primary/50">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="w-5 h-5"/>
                        </AvatarFallback>
                    </Avatar>
                )}
                 <div className={`rounded-lg p-3 max-w-[80%] ${
                    turn.role === 'ai' ? 'bg-secondary' : 'bg-primary text-primary-foreground'
                }`}>
                    <p className="text-sm whitespace-pre-wrap">{turn.content}</p>
                 </div>
                 {turn.role === "user" && (
                     <Avatar className="w-8 h-8">
                        <AvatarFallback>
                            <User className="w-5 h-5"/>
                        </AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3">
                     <Avatar className="w-8 h-8 border-2 border-primary/50">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="w-5 h-5"/>
                        </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-secondary">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
       <CardFooter className="pt-4 border-t flex-col items-start">
        <div className="mb-4 w-full flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <Label className="mb-2 block">Tutor Mode</Label>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={mode === 'help' ? 'default' : 'outline'}
                        onClick={() => setMode('help')}
                        size="sm"
                        className="flex-1"
                    >
                        Help Mode
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'research' ? 'default' : 'outline'}
                        onClick={() => setMode('research')}
                        size="sm"
                        className="flex-1"
                    >
                        Research Mode
                    </Button>
                </div>
            </div>
            <div className="flex-1">
                <Label htmlFor="model-select" className="mb-2 block">AI Model</Label>
                <Select value={selectedModel} onValueChange={(value: SupportedModel) => setSelectedModel(value)}>
                    <SelectTrigger id="model-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(tier === 'max') && <SelectItem value="haiku">Claude 3.5 Haiku</SelectItem>}
                        <SelectItem value="flash">Gemini 2.5 Flash</SelectItem>
                        {(tier === 'pro') && <SelectItem value="pro">Gemini 2.5 Pro</SelectItem>}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full items-start gap-2"
          >
            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Explain the theory of relativity"
                      {...field}
                      rows={1}
                      className="min-h-[40px]"
                      disabled={isButtonDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isButtonDisabled}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ask"
              )}
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
