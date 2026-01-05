'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, Video, AlertCircle } from 'lucide-react';
import { useAppState } from '@/components/app-state-provider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getVideoAction } from '@/lib/actions';
import AdPlaceholder from '@/components/ad-placeholder';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  topic: z
    .string()
    .min(5, { message: 'Please enter a topic with at least 5 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function VideoGeneratorPage() {
  const {
    isPremium,
    canMakeVideoRequest,
    incrementVideoRequestCount,
    videoRequestsRemaining,
    videoRequestLimit,
  } = useAppState();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!isPremium || !canMakeVideoRequest()) {
      setError(
        'Upgrade to Premium to use this feature or you have reached your daily video generation limit.'
      );
      return;
    }
    setIsLoading(true);
    setVideoUrl(null);
    setError(null);

    incrementVideoRequestCount();
    const result = await getVideoAction(data);

    if (result.success) {
      setVideoUrl(result.data.videoUrl);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };
  
  const videoRequestPercentage = (videoRequestsRemaining / videoRequestLimit) * 100;

  if (!isPremium) {
    return (
      <div className="flex flex-col gap-8 items-center justify-center h-full text-center">
        <header>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            AI Video Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            This is a premium feature.
          </p>
        </header>
        <AdPlaceholder className="max-w-md" />
      </div>
    );
  }

  const isButtonDisabled = isLoading || !canMakeVideoRequest();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          AI Video Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Create short tutorial videos on any study-related topic. (Premium
          Only)
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Generate Your Video</CardTitle>
            <CardDescription>
              Enter a topic and let our AI create a tutorial for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Videos remaining today</span>
                    <span>{videoRequestsRemaining} / {videoRequestLimit}</span>
                </div>
                 <Progress value={videoRequestPercentage} />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., How photosynthesis works"
                          {...field}
                          disabled={isButtonDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isButtonDisabled} className="w-full">
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate Video
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Video</CardTitle>
          </CardHeader>
          <CardContent className="aspect-video bg-muted rounded-md flex items-center justify-center">
            {isLoading && (
              <div className="text-center text-muted-foreground space-y-2">
                <Loader2 className="h-10 w-10 animate-spin mx-auto" />
                <p className="font-semibold">Generating video...</p>
                <p className="text-sm">This can take up to a minute. Please wait.</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!isLoading && !error && videoUrl && (
              <video src={videoUrl} controls className="w-full h-full rounded-md" />
            )}
            {!isLoading && !error && !videoUrl && (
              <div className="text-center text-muted-foreground space-y-2">
                <Video className="h-10 w-10 mx-auto" />
                <p>Your generated video will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
