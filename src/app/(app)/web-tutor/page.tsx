"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Globe, Loader2, ExternalLink, User, Trash2, Lock, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/components/app-state-provider";
import { webTutorAction } from "@/lib/actions";
import Link from "next/link";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL (e.g., https://example.com)"),
});

const questionSchema = z.object({
  question: z.string().min(5, "Please enter a question with at least 5 characters."),
});

type UrlFormValues = z.infer<typeof urlSchema>;
type QuestionFormValues = z.infer<typeof questionSchema>;

interface ConversationTurn {
  role: "user" | "ai";
  content: string;
}

export default function WebTutorPage() {
  const { tier, hasTokens, consumeTokens } = useAppState();
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const model = tier === 'max' ? 'haiku' : 'flash';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, isAiLoading]);

  const urlForm = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  });

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: { question: "" },
  });

  const onLoadUrl: SubmitHandler<UrlFormValues> = (data) => {
    setIsLoadingPage(true);
    setConversation([]);
    // Ensure URL has protocol
    let url = data.url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    setLoadedUrl(url);
    // The iframe will trigger its own load event
    setTimeout(() => setIsLoadingPage(false), 1500);
  };

  const onAskQuestion: SubmitHandler<QuestionFormValues> = async (data) => {
    if (!loadedUrl || !hasTokens(model)) return;

    setIsAiLoading(true);
    setConversation((prev) => [...prev, { role: "user", content: data.question }]);

    const result = await webTutorAction({
      url: loadedUrl,
      question: data.question,
      conversationHistory: conversation,
      model,
    });

    if (result.success) {
      consumeTokens(result.data.totalTokens, model);
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: result.data.answer },
      ]);
      questionForm.reset();
    } else {
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: `Error: ${result.error}` },
      ]);
    }

    setIsAiLoading(false);
  };

  // Gate: Max tier only
  if (tier !== "max") {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
            Web Tutor
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered help for any website.
          </p>
        </header>
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-headline">Max Tier Feature</h2>
            <p className="text-muted-foreground text-sm">
              Web Tutor is an exclusive Max tier feature. Upgrade to load any website and get AI-powered help understanding its content.
            </p>
            <Button asChild>
              <Link href="/profile">
                <Crown className="mr-2 h-4 w-4" /> Upgrade to Max
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
          <Globe className="h-7 w-7 text-primary" />
          Web Tutor
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste a website URL and ask the AI anything about its content.
        </p>
      </header>

      {/* URL Input Bar */}
      <Form {...urlForm}>
        <form onSubmit={urlForm.handleSubmit(onLoadUrl)} className="flex gap-2">
          <FormField
            control={urlForm.control}
            name="url"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input
                    placeholder="https://en.wikipedia.org/wiki/Photosynthesis"
                    {...field}
                    className="h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoadingPage} className="h-10 shrink-0">
            {isLoadingPage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
          </Button>
        </form>
      </Form>

      {/* Main Content: iframe + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow min-h-0" style={{ minHeight: '60vh' }}>
        {/* Website Preview */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {loadedUrl ? "Website Preview" : "No Website Loaded"}
            </CardTitle>
            {loadedUrl && (
              <Button variant="ghost" size="sm" className="h-7 gap-1" asChild>
                <a href={loadedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" /> Open
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-grow p-0 relative">
            {loadedUrl ? (
              <iframe
                src={loadedUrl}
                className="w-full h-full border-0 rounded-b-lg"
                sandbox="allow-scripts allow-same-origin"
                title="Website Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
                <div>
                  <Globe className="mx-auto h-12 w-12 mb-4 opacity-30" />
                  <p>Enter a URL above and click <strong>Load</strong> to preview a website here.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-primary" />
                Ask About This Page
              </CardTitle>
              {conversation.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setConversation([])}>
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-grow overflow-hidden min-h-0 p-0 px-4">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-4 py-2">
                {conversation.length === 0 && !loadedUrl && (
                  <div className="text-center text-muted-foreground p-6 text-sm">
                    Load a website to start asking questions.
                  </div>
                )}
                {conversation.length === 0 && loadedUrl && (
                  <div className="text-center text-muted-foreground p-6 text-sm">
                    <Bot className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    Website loaded! Ask any question about its content below.
                  </div>
                )}
                {conversation.map((turn, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${turn.role === "ai" ? "" : "justify-end"}`}
                  >
                    {turn.role === "ai" && (
                      <Avatar className="w-7 h-7 border-2 border-primary/50 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-lg p-3 max-w-[85%] ${
                      turn.role === "ai" ? "bg-secondary" : "bg-primary text-primary-foreground"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{turn.content}</p>
                    </div>
                    {turn.role === "user" && (
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex items-start gap-2.5">
                    <Avatar className="w-7 h-7 border-2 border-primary/50 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-secondary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="pt-3 border-t">
            <Form {...questionForm}>
              <form
                onSubmit={questionForm.handleSubmit(onAskQuestion)}
                className="flex w-full items-start gap-2"
              >
                <FormField
                  control={questionForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Textarea
                          placeholder={loadedUrl ? "What is this page about?" : "Load a website first..."}
                          {...field}
                          rows={1}
                          className="min-h-[38px] text-sm"
                          disabled={!loadedUrl || isAiLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="sm" disabled={!loadedUrl || isAiLoading} className="h-[38px]">
                  {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
                </Button>
              </form>
            </Form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
