'use client';

import { Suspense } from 'react';
import FlashcardGenerator from '@/components/flashcards/flashcard-generator';

export default function FlashcardsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Flashcard Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Create a set of flashcards on any topic to study with.
        </p>
      </header>
      <Suspense fallback={<div>Loading...</div>}>
        <FlashcardGenerator />
      </Suspense>
    </div>
  );
}
