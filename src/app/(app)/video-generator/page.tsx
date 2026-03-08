'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { VideoOff } from 'lucide-react';

export default function VideoGeneratorPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          AI Video Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          This feature is no longer available.
        </p>
      </header>
      <Card className="flex items-center justify-center text-center h-96">
        <CardContent className="p-6">
            <VideoOff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Feature Unavailable</CardTitle>
            <CardDescription className="mt-2">The AI Video Generator has been disabled.</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
