
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, CheckCircle, XCircle, ScanLine } from "lucide-react";
import Confetti from 'react-dom-confetti';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQuizAction } from "@/lib/actions";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Separator } from "../ui/separator";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "../ad-placeholder";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Please enter a topic with at least 3 characters." }),
  subject: z.string().min(1, { message: "Please select a subject." }),
  gradeLevel: z.string().min(1, { message: "Please select a grade level." }),
  numQuestions: z.coerce.number().int().min(3).max(10).default(5),
});

type FormValues = z.infer<typeof formSchema>;

interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

interface QuizResult {
  questions: QuizQuestion[];
}

const subjects = ["Math", "Science", "History", "English", "Physics", "Chemistry", "Biology", "Geography", "Art"];
const gradeLevels = ["Elementary", "Middle School", "High School", "University"];

export default function QuizGenerator({ initialQuiz, initialTopic }: { initialQuiz?: QuizQuestion[] | null, initialTopic?: string | null }) {
  const [result, setResult] = useState<QuizResult | null>(initialQuiz ? { questions: initialQuiz } : null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(!!initialQuiz);
  const [score, setScore] = useState(0);
  const { isPremium, canMakeRequest, incrementRequestCount } = useAppState();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: initialTopic || "",
      subject: "",
      gradeLevel: "",
      numQuestions: 5,
    },
  });

   useEffect(() => {
    if (initialQuiz) {
      setResult({ questions: initialQuiz });
      setSubmitted(false); // Don't show results immediately
    }
    if(initialTopic) {
        form.setValue("topic", initialTopic);
    }
  }, [initialQuiz, initialTopic, form]);


  const handleGenerateQuiz: SubmitHandler<FormValues> = async (data) => {
    if (!canMakeRequest()) {
        setError("You have reached your daily request limit. Please upgrade or try again tomorrow.");
        return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);
    setSubmitted(false);
    setUserAnswers({});
    setScore(0);

    incrementRequestCount();
    const actionResult = await getQuizAction({ ...data, isPremium });

    if (actionResult.success) {
      setResult(actionResult.data);
    } else {
      setError(actionResult.error);
    }

    setIsLoading(false);
  };
  
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({...prev, [questionIndex]: answer}));
  };

  const handleSubmitQuiz = () => {
    if (!result) return;
    let newScore = 0;
    result.questions.forEach((q, index) => {
        if(userAnswers[index] === q.answer) {
            newScore++;
        }
    });
    setScore(newScore);
    setSubmitted(true);
  }

  const getOptionState = (question: QuizQuestion, option: string, questionIndex: number): "correct" | "incorrect" | "default" => {
    if(!submitted) return "default";
    const isCorrect = option === question.answer;
    const isUserChoice = userAnswers[questionIndex] === option;

    if (isCorrect) return "correct";
    if (isUserChoice && !isCorrect) return "incorrect";
    return "default";
  }

  const startNewQuiz = () => {
    setResult(null);
    setSubmitted(false);
    setUserAnswers({});
    setScore(0);
    form.reset();
  }

  const quizTopic = result && form.getValues("topic") ? `on ${form.getValues("topic")}` : "";
  const isButtonDisabled = isLoading || !canMakeRequest();

  return (
    <div className="space-y-8">
      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Create Your Quiz</CardTitle>
            <CardDescription>Fill in the details below or scan a document to generate a new quiz.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isPremium && <AdPlaceholder className="mb-4" />}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateQuiz)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., The Solar System" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="numQuestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                         <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} disabled={isLoading}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select number of questions" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n} Questions</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a grade level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gradeLevels.map((gl) => (
                              <SelectItem key={gl} value={gl}>{gl}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isButtonDisabled}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2"/>Generate Quiz</>}
                </Button>
                 {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              </form>
            </Form>
            <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-sm text-muted-foreground">OR</span>
            </div>
            <Button variant="secondary" className="w-full" asChild>
                <Link href="/scan">
                    <ScanLine className="mr-2"/> Generate Quiz From Scan
                </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline">Your Quiz {quizTopic}</CardTitle>
                        <CardDescription>Select the best answer for each question.</CardDescription>
                    </div>
                    <Button onClick={startNewQuiz} variant="outline" size="sm">Start New Quiz</Button>
                </div>
            </CardHeader>
            <CardContent>
                {submitted && (
                     <Alert className="mb-6 relative overflow-hidden">
                        <Confetti active={submitted && score / result.questions.length >= 0.8} config={{
                            angle: 90,
                            spread: 180,
                            startVelocity: 40,
                            elementCount: 70,
                            dragFriction: 0.12,
                            duration: 3000,
                            stagger: 3,
                            width: "10px",
                            height: "10px",
                            perspective: "500px",
                            colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
                        }}/>
                        <AlertTitle className="font-headline">Quiz Complete!</AlertTitle>
                        <AlertDescription>You scored {score} out of {result.questions.length}.</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-8">
                    {result.questions.map((q, i) => (
                        <div key={i}>
                            <p className="font-semibold mb-4">{i + 1}. {q.question}</p>
                            <RadioGroup onValueChange={(val) => handleAnswerChange(i, val)} disabled={submitted}>
                                {q.options.map((option, j) => {
                                    const state = getOptionState(q, option, i);
                                    return (
                                        <div key={j} className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                                            state === 'correct' ? 'bg-green-100 dark:bg-green-900/50 border-green-500 border' : 
                                            state === 'incorrect' ? 'bg-red-100 dark:bg-red-900/50 border-red-500 border' : 
                                            'bg-secondary/50'
                                        }`}>
                                            <RadioGroupItem value={option} id={`q${i}-o${j}`}/>
                                            <label htmlFor={`q${i}-o${j}`} className="flex-1 cursor-pointer">{option}</label>
                                            {state === 'correct' && <CheckCircle className="text-green-600 dark:text-green-400"/>}
                                            {state === 'incorrect' && <XCircle className="text-red-600 dark:text-red-400"/>}
                                        </div>
                                    )
                                })}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                
                {!submitted ? (
                    <Button onClick={handleSubmitQuiz} className="w-full mt-8" disabled={Object.keys(userAnswers).length !== result.questions.length}>
                        Submit Quiz
                    </Button>
                ) : (
                    <Button onClick={startNewQuiz} className="w-full mt-8" variant="secondary">
                        Try Another Quiz
                    </Button>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
