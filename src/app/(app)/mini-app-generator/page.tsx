
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, Sparkles, Gem, Shapes, Bot, User, Send, RefreshCw } from 'lucide-react';
import { useAppState } from '@/components/app-state-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { generateMiniAppAction, interactWithMiniAppAction } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const generationFormSchema = z.object({
  description: z.string().min(20, { message: 'Please describe the app you want in at least 20 characters.' }),
  withStudyBuddy: z.boolean().default(false),
});
type GenerationFormValues = z.infer<typeof generationFormSchema>;

const chatFormSchema = z.object({
  userInput: z.string().min(1, { message: 'Please enter a message.' }),
});
type ChatFormValues = z.infer<typeof chatFormSchema>;

type ConversationTurn = {
  role: 'user' | 'app';
  content: string;
};

function UpgradePrompt() {
    return (
        <Card className="flex items-center justify-center text-center h-96">
            <CardContent className="p-6">
                <Gem className="h-16 w-16 mx-auto text-purple-500 mb-4" />
                <CardTitle className="font-headline text-2xl">This Feature is for Max Subscribers</CardTitle>
                <CardDescription className="mt-2 mb-6">
                    Generate custom learning apps with AI by upgrading to the Max plan.
                </CardDescription>
                <Button asChild>
                    <Link href="/profile">Upgrade to Max</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function MiniAppGeneratorPage() {
  const [appDescription, setAppDescription] = useState<string | null>(null);
  const [withStudyBuddy, setWithStudyBuddy] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tier, hasTokens, consumeTokens } = useAppState();

  const modelToUse = 'pro'; // Max tier can use Pro, let's default to Pro for this.

  const generationForm = useForm<GenerationFormValues>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: {
      description: '',
      withStudyBuddy: false,
    },
  });

  const chatForm = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      userInput: '',
    },
  });
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
    }
  }, [conversation]);

  const onGenerationSubmit: SubmitHandler<GenerationFormValues> = async (data) => {
    if (tier !== 'max' || !hasTokens(modelToUse)) {
      setError(tier !== 'max' ? 'This feature is only available for Max subscribers.' : `You have reached your monthly token limit for the ${modelToUse} model.`);
      return;
    }
    setIsLoading(true);
    setConversation([]);
    setError(null);
    setAppDescription(data.description);
    setWithStudyBuddy(data.withStudyBuddy);

    const actionResult = await generateMiniAppAction({ ...data, model: modelToUse });

    if (actionResult.success) {
      consumeTokens(actionResult.data.totalTokens, modelToUse);
      setConversation([{ role: 'app', content: actionResult.data.appResponse }]);
    } else {
      setError(actionResult.error);
      setAppDescription(null);
    }

    setIsLoading(false);
  };
  
  const onChatSubmit: SubmitHandler<ChatFormValues> = async (data) => {
      if (!hasTokens(modelToUse) || !appDescription) return;
      
      setIsResponding(true);
      const newUserTurn: ConversationTurn = { role: 'user', content: data.userInput };
      const newConversationHistory = [...conversation, newUserTurn];
      setConversation(newConversationHistory);
      chatForm.reset();

      const actionResult = await interactWithMiniAppAction({
          appDescription,
          conversationHistory: newConversationHistory,
          userInput: data.userInput,
          withStudyBuddy,
          model: modelToUse
      });

      if (actionResult.success) {
          consumeTokens(actionResult.data.totalTokens, modelToUse);
          setConversation(prev => [...prev, { role: 'app', content: actionResult.data.appResponse }]);
      } else {
          setConversation(prev => [...prev, { role: 'app', content: `Sorry, an error occurred: ${actionResult.error}` }]);
      }
      setIsResponding(false);
  }
  
  const startNew = () => {
    setAppDescription(null);
    setConversation([]);
    setError(null);
    setWithStudyBuddy(false);
    generationForm.reset();
  }

  if (tier !== 'max') {
      return (
          <div className="flex flex-col gap-8">
              <header>
                <h1 className="text-3xl font-bold font-headline tracking-tight">AI Mini-App Generator</h1>
                <p className="text-muted-foreground mt-1">Create custom AI-powered apps to help you learn any topic.</p>
              </header>
              <UpgradePrompt />
          </div>
      );
  }
  
  const isGenerationDisabled = isLoading || (tier === 'max' && !hasTokens(modelToUse));
  const isChatDisabled = isResponding || (tier === 'max' && !hasTokens(modelToUse));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">AI Mini-App Generator</h1>
            <p className="text-muted-foreground mt-1">
              {appDescription 
                ? 'Interact with your custom-built learning app.' 
                : 'Describe a learning tool, and our AI will build a mini, text-based version for you!'}
            </p>
        </div>
        {appDescription && (
            <Button onClick={startNew} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/> Start New App</Button>
        )}
      </header>

      {conversation.length === 0 ? (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Describe Your App</CardTitle>
                <CardDescription>Be specific! For example: "An app that pretends to be a historian and quizzes me about the Roman Empire."</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...generationForm}>
                    <form onSubmit={generationForm.handleSubmit(onGenerationSubmit)} className="space-y-6">
                    <FormField
                        control={generationForm.control}
                        name="description"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <Textarea
                                placeholder="e.g., An app that helps me practice Spanish vocabulary for ordering food at a restaurant."
                                rows={8}
                                {...field}
                                disabled={isGenerationDisabled}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={generationForm.control}
                        name="withStudyBuddy"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isGenerationDisabled}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Use Study Buddy AI Personality
                                </FormLabel>
                                <FormDescription>
                                Give your mini-app the enthusiastic and encouraging personality of your Study Buddy.
                                </FormDescription>
                            </div>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isGenerationDisabled}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Generate App</>}
                    </Button>
                     {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    </form>
                </Form>
            </CardContent>
        </Card>
      ) : (
        <Card className="h-full flex flex-col max-h-[70vh]">
            <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden pt-6">
                <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {conversation.map((turn, index) => (
                          <div key={index} className={cn("flex items-start gap-3", turn.role === "user" && "justify-end")}>
                            {turn.role === "app" && (
                                <Avatar className="w-8 h-8 border-2 border-primary/50"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-5 h-5"/></AvatarFallback></Avatar>
                            )}
                            <div className={cn("rounded-lg p-3 max-w-[85%] text-sm whitespace-pre-wrap", turn.role === 'app' ? 'bg-secondary' : 'bg-primary text-primary-foreground')}>
                                {turn.content}
                            </div>
                            {turn.role === "user" && (
                                <Avatar className="w-8 h-8"><AvatarFallback><User className="w-5 h-5"/></AvatarFallback></Avatar>
                            )}
                          </div>
                        ))}
                         {isResponding && (
                            <div className="flex items-start gap-3">
                                <Avatar className="w-8 h-8 border-2 border-primary/50"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-5 h-5"/></AvatarFallback></Avatar>
                                <div className="rounded-lg p-3 bg-secondary"><Loader2 className="h-5 w-5 animate-spin" /></div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <Form {...chatForm}>
                    <form onSubmit={chatForm.handleSubmit(onChatSubmit)} className="flex w-full items-start gap-2">
                        <FormField
                            control={chatForm.control}
                            name="userInput"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormControl>
                                        <Textarea
                                            placeholder="Interact with your app..."
                                            {...field}
                                            rows={1}
                                            className="min-h-[40px]"
                                            disabled={isChatDisabled}
                                             onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    chatForm.handleSubmit(onChatSubmit)();
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="icon" disabled={isChatDisabled}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </Form>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
