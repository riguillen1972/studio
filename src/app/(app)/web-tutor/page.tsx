"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Globe, Loader2, ExternalLink, User, Trash2, Lock, Crown, MessageCircleQuestion, AlertTriangle } from "lucide-react";

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
  url: z.string().min(1, "Please enter a URL"),
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
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAskPanel, setShowAskPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const model = tier === 'max' ? 'haiku' : 'flash';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, isAiLoading]);

  // Detect if iframe was blocked after a timeout
  const handleIframeLoad = useCallback(() => {
    setIsLoadingPage(false);
    // If the iframe loaded but is cross-origin, we can't access its content
    // We'll just assume it worked if we get this callback
    setIframeBlocked(false);
  }, []);

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
    setIframeBlocked(false);
    setShowAskPanel(false);
    // Ensure URL has protocol
    let url = data.url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    setLoadedUrl(url);
    
    // Set a timeout to detect if the iframe was blocked
    setTimeout(() => {
      setIsLoadingPage(false);
      // After timeout, check if something loaded by trying to detect the blank state
      // Most blocked iframes will just show a blank white page
    }, 3000);
  };

  const onAskQuestion: SubmitHandler<QuestionFormValues> = async (data) => {
    if (!loadedUrl || !hasTokens(model)) return;

    setShowAskPanel(true);
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
          Paste a website URL, then click the <strong>Ask AI</strong> button to ask questions about the page.
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
          {!showAskPanel && loadedUrl && (
            <Button 
              type="button" 
              onClick={() => setShowAskPanel(true)} 
              className="h-10 shrink-0 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 animate-bounce-subtle shadow-md"
            >
              <MessageCircleQuestion className="h-4 w-4" />
              Ask AI
            </Button>
          )}
        </form>
      </Form>

      {/* Main Content Area */}
      <div className="flex-grow min-h-0" style={{ minHeight: '65vh' }}>
        {!showAskPanel ? (
          /* Website Preview with Floating Ask AI button */
          <Card className="h-full flex flex-col overflow-hidden relative">
            <CardHeader className="pb-2 flex-row items-center justify-between shrink-0">
              <CardTitle className="text-sm font-medium">
                {loadedUrl ? "Website Preview" : "No Website Loaded"}
              </CardTitle>
              {loadedUrl && (
                <Button variant="ghost" size="sm" className="h-7 gap-1" asChild>
                  <a href={loadedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" /> Open in New Tab
                  </a>
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-grow p-0 relative">
              {loadedUrl ? (
                <>
                  <iframe
                    ref={iframeRef}
                    src={loadedUrl}
                    className="w-full h-full border-0 rounded-b-lg"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    title="Website Preview"
                    onLoad={handleIframeLoad}
                  />

                  {/* Info banner about iframe limitations */}
                  <div className="absolute top-2 left-2 right-2 z-10">
                    <div className="bg-background/90 backdrop-blur-sm border rounded-lg p-2.5 text-xs text-muted-foreground flex items-start gap-2 shadow-sm">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-yellow-500" />
                      <span>
                        Some websites block iframe previews. Don&apos;t worry — the AI can still read and analyze the page content. Click the <strong>Ask AI</strong> button at the top!
                      </span>
                    </div>
                  </div>
                </>
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
        ) : (
          /* Chat Panel (full width when active) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Mini Website Preview */}
            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-2 flex-row items-center justify-between shrink-0">
                <CardTitle className="text-sm font-medium">Website Preview</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 gap-1" asChild>
                    <a href={loadedUrl!} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-0 relative">
                <iframe
                  src={loadedUrl!}
                  className="w-full h-full border-0 rounded-b-lg"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title="Website Preview"
                />
                <div className="absolute top-2 left-2 right-2 z-10">
                  <div className="bg-background/90 backdrop-blur-sm border rounded-lg p-2 text-xs text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-yellow-500" />
                    <span>Some websites may not show here, but the AI can still read the page.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-primary" />
                    Ask About This Page
                  </CardTitle>
                  <div className="flex gap-1">
                    {conversation.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setConversation([])}>
                        <Trash2 className="h-3 w-3" /> Clear
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Analyzing: {loadedUrl}
                </p>
              </CardHeader>

              <CardContent className="flex-grow overflow-hidden min-h-0 p-0 px-4">
                <ScrollArea className="h-full pr-4 -mr-4">
                  <div className="space-y-4 py-2">
                    {conversation.length === 0 && (
                      <div className="text-center text-muted-foreground p-6 text-sm">
                        <Bot className="mx-auto h-10 w-10 mb-3 opacity-30" />
                        Ask any question about this page below.
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

              <CardFooter className="pt-3 border-t shrink-0">
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
                              placeholder="What is this page about?"
                              {...field}
                              rows={1}
                              className="min-h-[38px] text-sm"
                              disabled={isAiLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="sm" disabled={isAiLoading} className="h-[38px]">
                      {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
                    </Button>
                  </form>
                </Form>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
