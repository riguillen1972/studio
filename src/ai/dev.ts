'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-explanation.ts';
import '@/ai/flows/provide-homework-hints.ts';
import '@/ai/flows/summarize-text.ts';
import '@/ai/flows/scan-homework-flow.ts';
import '@/ai/flows/generate-quiz.ts';
import '@/ai/flows/generate-quiz-from-scan.ts';
import '@/ai/flows/get-bible-verse.ts';
import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/get-friendly-advice.ts';
import '@/ai/flows/generate-mini-app.ts';
