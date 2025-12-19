"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Lightbulb, Loader2, RefreshCw, Send } from "lucide-react";
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getHomeworkScanAction } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  question: z.string().min(10, { message: "Please ask a question with at least 10 characters." }),
  subject: z.string().min(1, { message: "Please select a subject." }),
  gradeLevel: z.string().min(1, { message: "Please select a grade level." }),
});

type FormValues = z.infer<typeof formSchema>;

interface HintsResult {
  hints: string[];
  guidance: string;
}

const subjects = ["Math", "Science", "History", "English", "Physics", "Chemistry", "Biology"];
const gradeLevels = ["Elementary", "Middle School", "High School", "University"];

export default function HomeworkScanner() {
  const [result, setResult] = useState<HintsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function getCameraPermission() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (err) {
          console.error("Error accessing camera:", err);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings.",
          });
        }
      } else {
        setHasCameraPermission(false);
        toast({
            variant: "destructive",
            title: "Camera Not Supported",
            description: "Your browser does not support camera access.",
          });
      }
    }
    if(capturedImage === null) {
        getCameraPermission();
    }
  }, [toast, capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
        if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    form.reset();
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!capturedImage) {
        setError("Please capture an image first.");
        return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);

    const actionResult = await getHomeworkScanAction({
        ...data,
        photoDataUri: capturedImage,
    });

    if (actionResult.success) {
      setResult(actionResult.data);
    } else {
      setError(actionResult.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">Scan Your Work</CardTitle>
          <CardDescription>Capture an image of your homework problem.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
            <div className="relative aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {capturedImage ? (
                    <Image src={capturedImage} alt="Captured homework" layout="fill" objectFit="contain" />
                ) : (
                    <>
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {hasCameraPermission === false && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                                 <Alert variant="destructive">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access to use this feature. You may need to refresh the page and grant permission.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex justify-center mt-4">
                {capturedImage ? (
                    <Button onClick={handleRetake} variant="outline" disabled={isLoading}><RefreshCw className="mr-2"/> Retake Photo</Button>
                ) : (
                    <Button onClick={handleCapture} disabled={hasCameraPermission !== true || isLoading}><Camera className="mr-2"/> Capture</Button>
                )}
            </div>

            {capturedImage && (
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                        <FormField
                            control={form.control}
                            name="question"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Question</FormLabel>
                                <FormControl>
                                <Textarea
                                    placeholder="e.g., I'm stuck on question 3, can you explain the first step?"
                                    rows={3}
                                    {...field}
                                    disabled={isLoading}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
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
                                    </Trigger>
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
                        <Button type="submit" className="w-full" disabled={isLoading || !capturedImage}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <><Send className="mr-2"/> Get Hints</>}
                        </Button>
                    </form>
                </Form>
            )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI Generated Hints</CardTitle>
          <CardDescription>Guidance based on your scanned problem.</CardDescription>
        </Header>
        <CardContent className="h-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {!isLoading && !result && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Lightbulb className="h-12 w-12 mb-4" />
              <p>Your hints and guidance will appear here after you scan your work.</p>
            </div>
          )}
          {result && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Hints</h3>
                <Accordion type="single" collapsible className="w-full">
                  {result.hints.map((hint, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>Hint #{index + 1}</AccordionTrigger>
                      <AccordionContent>{hint}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              <div>
                <h3 className="font-semibold mb-2">General Guidance</h3>
                <p className="text-sm text-muted-foreground bg-secondary p-4 rounded-md">{result.guidance}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
