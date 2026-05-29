'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, Sparkles, Gem, Shapes, Bot, User, Send, RefreshCw, Archive, Trash2 } from 'lucide-react';
import { useAppState } from '@/components/app-state-provider';
import AdPlaceholder from '@/components/ad-placeholder';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupportedModel } from '@/ai/genkit';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";


const generationFormSchema = z.object({
  description: z.string().min(20, { message: 'Please describe the app you want in at least 20 characters.' }),
  model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).default('haiku'),
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

type SavedApp = {
  id: string;
  name: string;
  appDescription: string;
  conversation: ConversationTurn[];
  model: SupportedModel;
  allowLLM: boolean;
  savedAt: string;
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
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tier, hasTokens, consumeTokens } = useAppState();
  const [selectedModel, setSelectedModel] = useState<SupportedModel>('haiku');
  const [allowLLM, setAllowLLM] = useState(false);
  const [allowLLMInConversation, setAllowLLMInConversation] = useState(false);
  
  const [savedApps, setSavedApps] = useState<SavedApp[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveAppName, setSaveAppName] = useState('');
  const { toast } = useToast();

  const modelToUse = selectedModel;

  const generationForm = useForm<GenerationFormValues>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: {
      description: '',
      model: 'haiku',
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
    try {
      const item = window.localStorage.getItem('savedMiniApps');
      const apps = item ? JSON.parse(item) : [];
      setSavedApps(apps);
    } catch (error) {
      console.error("Failed to load saved apps from localStorage", error);
      setSavedApps([]);
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
    }
  }, [conversation]);

  const onGenerationSubmit: SubmitHandler<GenerationFormValues> = async (data) => {
    const modelToUseOnSubmit = data.model;
    if (tier !== 'max' || !hasTokens(modelToUseOnSubmit)) {
      setError(tier !== 'max' ? 'This feature is only available for Max subscribers.' : `You have reached your monthly token limit for the ${modelToUseOnSubmit} model.`);
      return;
    }
    setIsLoading(true);
    setConversation([]);
    setError(null);
    setAppDescription(data.description);
    setSelectedModel(data.model);
    setAllowLLMInConversation(allowLLM);

    const actionResult = await generateMiniAppAction({ 
      description: data.description, 
      model: data.model,
      allowLLM: allowLLM,
    });

    if (actionResult.success) {
      consumeTokens(actionResult.data.totalTokens, data.model);
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
          model: modelToUse,
          allowLLM: allowLLMInConversation,
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
    setAllowLLM(false);
    generationForm.reset();
    setSaveAppName('');
  }

  const handleSaveApp = () => {
    if (!appDescription || !saveAppName) return;

    const newApp: SavedApp = {
      id: Date.now().toString(),
      name: saveAppName,
      appDescription: appDescription,
      conversation: conversation,
      model: modelToUse,
      allowLLM: allowLLMInConversation,
      savedAt: new Date().toISOString(),
    };
    
    const updatedApps = [...savedApps, newApp];
    setSavedApps(updatedApps);
    try {
      window.localStorage.setItem('savedMiniApps', JSON.stringify(updatedApps));
      toast({ title: "App Saved!", description: `"${saveAppName}" has been saved.` });
    } catch (error) {
      console.error("Failed to save app to localStorage", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save app to your computer's memory." });
    }

    setIsSaveDialogOpen(false);
    setSaveAppName('');
  };

  const handleLoadApp = (app: SavedApp) => {
    setAppDescription(app.appDescription);
    setConversation(app.conversation);
    setSelectedModel(app.model);
    setAllowLLMInConversation(app.allowLLM);
    setError(null);
  };

  const handleDeleteApp = (appId: string) => {
    const updatedApps = savedApps.filter(app => app.id !== appId);
    setSavedApps(updatedApps);
    try {
      window.localStorage.setItem('savedMiniApps', JSON.stringify(updatedApps));
      toast({ title: "App Deleted" });
    } catch (error) {
      console.error("Failed to delete app from localStorage", error);
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  if (tier !== 'max') {
      return (
          <div className="flex flex-col gap-8">
              <header>
                <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">AI Mini-App Generator</h1>
                <p className="text-muted-foreground mt-1">Create custom AI-powered apps to help you learn any topic.</p>
              </header>
              {tier === 'free' && <AdPlaceholder className="mb-4" />}
              <UpgradePrompt />
          </div>
      );
  }
  
  const isGenerationDisabled = isLoading || (tier === 'max' && !hasTokens(generationForm.watch('model')));
  const isChatDisabled = isResponding || (tier === 'max' && !hasTokens(modelToUse));
  
  if (!appDescription) {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">AI Mini-App Generator</h1>
          <p className="text-muted-foreground mt-1">Describe a learning tool, or load a saved session.</p>
        </header>
        {/* AdPlaceholder intentionally omitted here because this view is only for Max users */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
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
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generationForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="haiku">Gemini 2.0 Flash</SelectItem>
                            <SelectItem value="flash">Gemini 2.5 Flash</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          More advanced models offer higher quality responses for more complex apps.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2 rounded-md border p-4">
                    <div className="flex items-center space-x-3">
                      <Switch id="allow-llm" checked={allowLLM} onCheckedChange={setAllowLLM} disabled={isLoading} />
                      <Label htmlFor="allow-llm" className="cursor-pointer">Enable AI Tools in your App</Label>
                    </div>
                    <FormDescription className="pl-9">
                      Allows your app to use other Study Buddy AI models to perform complex tasks like summarizing text.
                    </FormDescription>
                  </div>
                  <Button type="submit" className="w-full" disabled={isGenerationDisabled}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Generate App</>}
                  </Button>
                  {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Your Saved Apps</CardTitle>
              <CardDescription>Load a previous session to continue where you left off.</CardDescription>
            </CardHeader>
            <CardContent>
              {savedApps.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {savedApps.map(app => (
                      <div key={app.id} className="flex items-center justify-between rounded-md border p-4">
                        <div>
                          <p className="font-semibold">{app.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Saved on {new Date(app.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleLoadApp(app)}>Load</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{app.name}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteApp(app.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                  <Archive className="mx-auto h-12 w-12 mb-4"/>
                  <p>You haven't saved any apps yet.</p>
                  <p className="text-xs mt-1">Your saved apps will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">AI Mini-App Generator</h1>
            <p className="text-muted-foreground mt-1">Interact with your custom-built learning app.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsSaveDialogOpen(true)} variant="outline"><Archive className="mr-2 h-4 w-4"/> Save Session</Button>
            <Button onClick={startNew} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/> Start New App</Button>
        </div>
      </header>
      {/* AdPlaceholder intentionally omitted here because this view is only for Max users */}

      <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Save Mini-App Session</AlertDialogTitle>
                <AlertDialogDescription>
                    Give your app session a name so you can continue it later.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="app-name">App Name</Label>
                <Input 
                    id="app-name" 
                    value={saveAppName}
                    onChange={(e) => setSaveAppName(e.target.value)}
                    placeholder="e.g., Roman Empire Historian"
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSaveAppName('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveApp} disabled={!saveAppName}>Save</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </div>
  );
}
