
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, Sparkles, Gem, Shapes } from 'lucide-react';
import { useAppState } from '@/components/app-state-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { generateMiniAppAction } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';


const formSchema = z.object({
  description: z.string().min(20, { message: 'Please describe the app you want in at least 20 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

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
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tier, hasTokens, consumeTokens } = useAppState();

  const modelToUse = 'pro'; // Max tier can use Pro or Haiku, let's default to Pro for this.

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (tier !== 'max') {
        setError('This feature is only available for Max subscribers.');
        return;
    }
    if (!hasTokens(modelToUse)) {
      setError(`You have reached your monthly token limit for the ${modelToUse} model. Please try again next month.`);
      return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);

    const actionResult = await generateMiniAppAction({ ...data, model: modelToUse });

    if (actionResult.success) {
      consumeTokens(actionResult.data.totalTokens, modelToUse);
      setResult(actionResult.data.appResponse);
    } else {
      setError(actionResult.error);
    }

    setIsLoading(false);
  };
  
  if (tier !== 'max') {
      return (
          <div className="flex flex-col gap-8">
              <header>
                <h1 className="text-3xl font-bold font-headline tracking-tight">
                AI Mini-App Generator
                </h1>
                <p className="text-muted-foreground mt-1">
                Create custom AI-powered apps to help you learn any topic.
                </p>
            </header>
            <UpgradePrompt />
          </div>
      );
  }

  const isButtonDisabled = isLoading || (tier === 'max' && !hasTokens(modelToUse));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          AI Mini-App Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Describe a learning tool you wish you had, and our AI will build a mini, text-based version for you!
        </p>
      </header>

       <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Describe Your App</CardTitle>
                <CardDescription>Be specific! For example: "An app that pretends to be a historian and quizzes me about the Roman Empire."</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
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
                    <Button type="submit" className="w-full" disabled={isButtonDisabled}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Generate App</>}
                    </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card className="min-h-[380px]">
            <CardHeader>
                <CardTitle className="font-headline">Your Mini-App</CardTitle>
                <CardDescription>Interact with your newly generated learning app below.</CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading && (
                <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {!isLoading && !result && !error && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Shapes className="h-12 w-12 mb-4" />
                <p>Your generated app will appear here.</p>
                </div>
            )}
            {result && (
                <ScrollArea className="h-64">
                    <div className="space-y-4 text-sm text-foreground/90 whitespace-pre-wrap bg-secondary p-4 rounded-md">
                        {result}
                    </div>
                </ScrollArea>
            )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
