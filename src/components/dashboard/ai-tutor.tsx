"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Loader2, Sparkles, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { getExplanationAction } from "@/lib/actions";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "../ad-placeholder";

const formSchema = z.object({
  concept: z.string().min(10, { message: "Please enter a concept or question with at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

interface ConversationTurn {
  role: "user" | "ai";
  content: string;
}

export default function AITutor() {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isPremium, canMakeRequest, incrementRequestCount } = useAppState();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concept: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!canMakeRequest()) {
        setConversation((prev) => [...prev, { role: "ai", content: "You have reached your daily request limit. Please upgrade or try again tomorrow." }]);
        return;
    }
    setIsLoading(true);
    setConversation((prev) => [...prev, { role: "user", content: data.concept }]);

    incrementRequestCount();
    const result = await getExplanationAction({ ...data, isPremium });

    if (result.success) {
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

  return (
    <Card className="h-full flex flex-col max-h-[75vh]">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Sparkles className="text-primary"/>
                AI Tutor
            </CardTitle>
            <CardDescription>
                Ask a question or describe a concept you want to understand better.
            </CardDescription>
        </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        {!isPremium && <AdPlaceholder />}
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
        <div className="pt-4 border-t">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
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
                        disabled={isLoading || !canMakeRequest()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !canMakeRequest()}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Ask"}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
