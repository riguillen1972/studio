'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Layers, Sparkles } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useAppState } from '@/components/app-state-provider';
import AdPlaceholder from '../ad-placeholder';
import { getFlashcardsAction } from '@/lib/actions';
import { useSearchParams } from 'next/navigation';
import FlashcardViewer from './flashcard-viewer';

const formSchema = z.object({
  topic: z
    .string()
    .min(3, { message: 'Please enter a topic with at least 3 characters.' }),
  subject: z.string().min(1, { message: 'Please select a subject.' }),
  gradeLevel: z.string().min(1, { message: 'Please select a grade level.' }),
  numFlashcards: z.coerce.number().int().min(5).max(20).default(10),
});

type FormValues = z.infer<typeof formSchema>;

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardResult {
  flashcards: Flashcard[];
}

const subjects = [
  'Math',
  'Science',
  'History',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Geography',
  'Art',
];
const gradeLevels = ['Elementary', 'Middle School', 'High School', 'University'];

export default function FlashcardGenerator() {
  const [result, setResult] = useState<FlashcardResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPremium, canMakeRequest, incrementRequestCount } = useAppState();
  const searchParams = useSearchParams();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      subject: '',
      gradeLevel: '',
      numFlashcards: 10,
    },
  });

  useEffect(() => {
    const topic = searchParams.get('topic');
    const subject = searchParams.get('subject');
    const gradeLevel = searchParams.get('gradeLevel');
    const numFlashcards = searchParams.get('numFlashcards');

    if (topic && subject && gradeLevel && numFlashcards) {
      form.reset({
        topic,
        subject,
        gradeLevel,
        numFlashcards: parseInt(numFlashcards),
      });
      // Automatically generate flashcards if all params are present
      handleGenerateFlashcards({
        topic,
        subject,
        gradeLevel,
        numFlashcards: parseInt(numFlashcards),
      });
    }
  }, [searchParams, form]);
  
  const handleGenerateFlashcards: SubmitHandler<FormValues> = async (data) => {
    if (!canMakeRequest()) {
      setError(
        'You have reached your daily request limit. Please upgrade or try again tomorrow.'
      );
      return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);

    incrementRequestCount();
    const actionResult = await getFlashcardsAction({ ...data, isPremium });

    if (actionResult.success) {
      setResult(actionResult.data);
    } else {
      setError(actionResult.error);
    }

    setIsLoading(false);
  };

  const startNew = () => {
    setResult(null);
    form.reset();
  };

  const isButtonDisabled = isLoading || !canMakeRequest();

  return (
    <div className="space-y-8">
      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Create Your Flashcards</CardTitle>
            <CardDescription>
              Fill in the details below to generate a new set of flashcards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isPremium && <AdPlaceholder className="mb-4" />}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleGenerateFlashcards)}
                className="space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., The American Revolution"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numFlashcards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Flashcards</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          defaultValue={String(field.value)}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of flashcards" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[5, 10, 15, 20].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n} Flashcards
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a grade level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gradeLevels.map((gl) => (
                              <SelectItem key={gl} value={gl}>
                                {gl}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isButtonDisabled}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="mr-2" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <FlashcardViewer
          flashcards={result.flashcards}
          topic={form.getValues('topic')}
          onStartNew={startNew}
        />
      )}
       {isLoading && !result && (
        <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="font-semibold text-lg">Generating your flashcards...</p>
                <p>This may take a moment.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
