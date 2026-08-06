"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, BookOpen, Quote, Sparkles, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getBibleVerseAction } from "@/lib/actions";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "@/components/ad-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isCrisis } from "@/lib/crisis-support";
import { Heart } from "lucide-react";

interface BibleVerse {
    verse: string;
    reference: string;
    explanation: string;
}

export default function BibleVersePage() {
    const [verseInfo, setVerseInfo] = useState<BibleVerse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [topic, setTopic] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { tier, hasTokens, consumeTokens, isLoaded } = useAppState();
    const [hasFetched, setHasFetched] = useState(false);
    const [showCrisis, setShowCrisis] = useState(false);
    
    // Use Gemini 2.5 Flash as default model since all tiers can access it
    const modelToUse = 'flash';

    const fetchVerse = async () => {
        const currentTopic = topic.trim();
        
        if (currentTopic && isCrisis(currentTopic)) {
            setShowCrisis(true);
            setError(null);
            setVerseInfo(null);
            return;
        }

        setShowCrisis(false);

        if (!hasTokens(modelToUse)) {
            setError("You have reached your monthly token limit. Please try again next month.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        const result = await getBibleVerseAction({ topic: topic.trim() || undefined, model: modelToUse });

        if ('data' in result) {
            const { totalTokens, verse, reference, explanation } = result.data;
            
            consumeTokens(totalTokens, modelToUse);
            setVerseInfo({ verse, reference, explanation });
        } else {
            // Because 'data' isn't in the object, TypeScript knows this is the error branch
            setError(result.error);
        }
        
        setIsLoading(false);
    };


    const isButtonDisabled = isLoading || !isLoaded || !hasTokens(modelToUse);

    return (
        <div className="flex flex-col gap-8">
             <header>
                <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
                Verse of the Day
                </h1>
                <p className="text-muted-foreground mt-1">
                Get a dose of daily inspiration.
                </p>
            </header>
            <Card className="max-w-2xl mx-auto w-full">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        Daily Bible Verse
                    </CardTitle>
                    <CardDescription>A moment of reflection and inspiration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); fetchVerse(); }} 
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="What's on your mind? (e.g., anxiety, upcoming test, gratitude)"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isButtonDisabled}
                        />
                        <Button type="submit" disabled={isButtonDisabled}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>

                    {tier === 'free' && <AdPlaceholder />}
                    
                    {showCrisis && (
                        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-6 text-left space-y-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                                <h3 className="text-lg font-bold text-foreground">Please talk to someone</h3>
                            </div>
                            <p className="text-foreground font-medium">
                                It sounds like you're going through something really hard, and that is too important for an AI tutor. Please tell a parent, teacher, counsellor or another adult you trust right now.
                            </p>
                            <div className="text-muted-foreground text-sm space-y-1">
                                <p>In the US, call or text 988 — the Suicide & Crisis Lifeline. It's free, 24/7.</p>
                                <p>Or text HOME to 741741 to reach the Crisis Text Line.</p>
                                <p>If you're in immediate danger, call 911.</p>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-6 w-1/3" />
                        </div>
                    ) : error ? (
                         <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : verseInfo ? (
                        <div className="text-center space-y-4">
                             <blockquote className="relative p-4 text-xl italic border-l-4 bg-secondary">
                                <Quote className="absolute top-2 left-2 h-6 w-6 text-muted-foreground/50 -translate-x-2 -translate-y-2 transform rotate-180" />
                                <p className="mb-4">{verseInfo.verse}</p>
                                <Quote className="absolute bottom-2 right-2 h-6 w-6 text-muted-foreground/50 translate-x-2 translate-y-2" />
                            </blockquote>
                            <cite className="block font-semibold text-primary not-italic">{verseInfo.reference}</cite>
                            {verseInfo.explanation && (
                                <p className="text-muted-foreground mt-4 text-sm bg-muted p-4 rounded-md">
                                    {verseInfo.explanation}
                                </p>
                            )}
                        </div>
                    ) : !showCrisis ? (
                        <div className="text-center text-muted-foreground py-10">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Tell me what's on your mind to find a relevant verse.</p>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}