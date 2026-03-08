
'use client';

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Loader2, MessageSquare, Send, Sparkles, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAppState } from "./app-state-provider";
import { getFriendlyAdviceAction } from "@/lib/actions";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  question: z.string().min(1, { message: "Please ask a question." }),
});

type FormValues = z.infer<typeof formSchema>;

interface ConversationTurn {
  role: "user" | "ai";
  content: string;
}

export default function FriendlyTutor() {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { tier, hasTokens, consumeTokens } = useAppState();
  const modelToUse = 'haiku';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!hasTokens(modelToUse)) {
        setConversation((prev) => [...prev, { role: "ai", content: "Oh no! It looks like you've reached your monthly token limit. We can chat again next month! ✨" }]);
        return;
    }
    if (!data.question.trim()) return;
    setIsLoading(true);
    setConversation((prev) => [...prev, { role: "user", content: data.question }]);

    const result = await getFriendlyAdviceAction({ question: data.question, model: modelToUse });

    if (result.success) {
      consumeTokens(result.data.totalTokens, modelToUse);
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: result.data.advice },
      ]);
      form.reset();
    } else {
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: `Oops, something went wrong: ${result.error}` },
      ]);
    }

    setIsLoading(false);
  };
  
  const isButtonDisabled = isLoading || (isClient && !hasTokens(modelToUse));

  if (!isClient) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
            <Button
                className="fixed bottom-6 right-6 h-16 w-16 sm:h-20 sm:w-20 blob-shape shadow-lg z-50 flex items-center justify-center
                           bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600
                           hover:from-sky-500 hover:via-blue-600 hover:to-indigo-700
                           border-2 border-white/30
                           text-white
                           transition-all duration-500"
            >
                <div className={cn("relative h-10 w-10 transition-all duration-300", isOpen && "rotate-90 scale-0")}>
                    {/* Eyes */}
                    <div className={cn("absolute top-[30%] left-[20%] w-2 h-2.5 rounded-full bg-current", isLoading ? "animate-thinking-left" : "transform -rotate-12")}></div>
                    <div className={cn("absolute top-[30%] right-[20%] w-2 h-2.5 rounded-full bg-current", isLoading ? "animate-thinking-right" : "transform rotate-12")}></div>
                    {/* Smile */}
                    <div className="absolute bottom-[30%] left-[50%] -translate-x-1/2 w-5 h-2.5 border-b-2 border-current rounded-b-full"></div>
                </div>
                <X className={cn("h-10 w-10 absolute transition-all duration-300", !isOpen && "-rotate-90 scale-0")} />
                <span className="sr-only">Toggle Study Buddy</span>
            </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={16} className="w-[90vw] sm:w-[80vw] max-w-md h-[60vh] sm:h-[70vh] p-0 flex flex-col">
            <Card className="h-full flex flex-col border-0">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Sparkles className="text-primary"/>
                        Your Study Buddy
                    </CardTitle>
                    <CardDescription>
                        I'm here to help you learn, but I won't give you the answers!
                    </CardDescription>
                </CardHeader>
              <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-grow pr-4 -mr-4">
                    <div className="space-y-6">
                    {conversation.length === 0 && (
                        <div className="text-center text-muted-foreground p-8">
                            <MessageSquare className="mx-auto h-12 w-12 mb-4"/>
                            <p>Ask me anything about your studies!</p>
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
                          name="question"
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormControl>
                                <Textarea
                                  placeholder="Ask your study buddy..."
                                  {...field}
                                  rows={1}
                                  className="min-h-[40px]"
                                  disabled={isButtonDisabled}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          form.handleSubmit(onSubmit)();
                                      }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" size="icon" disabled={isButtonDisabled || !form.formState.isValid}>
                          <Send />
                        </Button>
                      </form>
                    </Form>
                </div>
              </CardContent>
            </Card>
        </PopoverContent>
    </Popover>
  );
}
