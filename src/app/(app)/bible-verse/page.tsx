
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, BookOpen, Quote, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getBibleVerseAction } from "@/lib/actions";
import { useAppState } from "@/components/app-state-provider";
import AdPlaceholder from "@/components/ad-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface BibleVerse {
    verse: string;
    reference: string;
}

export default function BibleVersePage() {
    const [verseInfo, setVerseInfo] = useState<BibleVerse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isPremium, hasTokens, consumeTokens } = useAppState();
    const modelToUse = isPremium ? 'pro' : 'flash';

    const fetchVerse = async () => {
        if (!hasTokens(modelToUse)) {
            setError("You have reached your monthly token limit. Please try again next month.");
            return;
        }
        setIsLoading(true);
        setError(null);
        const result = await getBibleVerseAction({ model: modelToUse });

        if (result.success) {
            consumeTokens(result.data.totalTokens, modelToUse);
            setVerseInfo(result.data);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchVerse();
    }, [isPremium]);
    
    const isButtonDisabled = isLoading || !hasTokens(modelToUse);

    return (
        <div className="flex flex-col gap-8">
             <header>
                <h1 className="text-3xl font-bold font-headline tracking-tight">
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
                     {!isPremium && <AdPlaceholder />}
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
                        </div>
                    ) : null}
                     <Button onClick={fetchVerse} disabled={isButtonDisabled} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Get New Verse"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
