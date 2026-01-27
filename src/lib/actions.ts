"use server";

import { z } from "zod";
import { generateExplanation, GenerateExplanationInput } from "@/ai/flows/generate-explanation";
import { provideHomeworkHints, ProvideHomeworkHintsInput } from "@/ai/flows/provide-homework-hints";
import { summarizeText, SummarizeTextInput } from "@/ai/flows/summarize-text";
import { scanHomework, ScanHomeworkInput } from "@/ai/flows/scan-homework-flow";
import { generateQuiz, GenerateQuizInput } from "@/ai/flows/generate-quiz";
import { generateQuizFromScan, GenerateQuizFromScanInput } from "@/ai/flows/generate-quiz-from-scan";
import { getBibleVerse, GetBibleVerseInput } from "@/ai/flows/get-bible-verse";
import { generateFlashcards, GenerateFlashcardsInput } from "@/ai/flows/generate-flashcards";
import { getFriendlyAdvice, GetFriendlyAdviceInput } from "@/ai/flows/get-friendly-advice";

// This is a server-side check placeholder. In a real app, you would validate
// the user's request count against a database record.
const checkRequestLimit = (isPremium: boolean) => {
    // This is a placeholder for server-side validation.
    // In a real application, you'd fetch the user's request count from your database.
    return { success: true };
}

// Helper function to handle action execution and error handling
async function handleAction<T_Input, T_Output>(
  input: T_Input,
  flow: (input: T_Input, isPremium?: boolean) => Promise<T_Output>,
  isPremium: boolean = false
): Promise<{ success: true; data: T_Output } | { success: false; error: string }> {
  try {
    // In a real app, you'd have robust server-side validation here.
    // For this prototype, we trust the client-side check that will be added.
    const result = await flow(input, isPremium);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI action failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

// Schema for getExplanationAction
const ExplanationActionInputSchema = z.object({
  concept: z.string(),
  isPremium: z.boolean().optional(),
});
export async function getExplanationAction(input: GenerateExplanationInput & { isPremium?: boolean }) {
  const parsedInput = ExplanationActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  const { isPremium, ...flowInput } = parsedInput.data;
  return handleAction(flowInput, generateExplanation, isPremium);
}

// Schema for getHomeworkHintsAction
const HomeworkHintsActionInputSchema = z.object({
  problem: z.string(),
  subject: z.string(),
  gradeLevel: z.string(),
  isPremium: z.boolean().optional(),
});
export async function getHomeworkHintsAction(input: ProvideHomeworkHintsInput & { isPremium?: boolean }) {
    const parsedInput = HomeworkHintsActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
  return handleAction(flowInput, provideHomeworkHints, isPremium);
}

// Schema for getSummaryAction
const SummaryActionInputSchema = z.object({
  text: z.string(),
  isPremium: z.boolean().optional(),
});
export async function getSummaryAction(input: SummarizeTextInput & { isPremium?: boolean }) {
    const parsedInput = SummaryActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
  return handleAction(flowInput, summarizeText, isPremium);
}

// Schema for getHomeworkScanAction
const HomeworkScanActionInputSchema = z.object({
    photoDataUri: z.string(),
    question: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    isPremium: z.boolean().optional(),
});
export async function getHomeworkScanAction(input: ScanHomeworkInput & { isPremium?: boolean }) {
    const parsedInput = HomeworkScanActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
    return handleAction(flowInput, scanHomework, isPremium);
}

// Schema for getQuizAction
const QuizActionInputSchema = z.object({
    topic: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    numQuestions: z.number(),
    isPremium: z.boolean().optional(),
});
export async function getQuizAction(input: GenerateQuizInput & { isPremium?: boolean }) {
    const parsedInput = QuizActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
    return handleAction(flowInput, generateQuiz, isPremium);
}

// Schema for getQuizFromScanAction
const QuizFromScanActionInputSchema = z.object({
    photoDataUri: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    numQuestions: z.number(),
    isPremium: z.boolean().optional(),
});
export async function getQuizFromScanAction(input: GenerateQuizFromScanInput & { isPremium?: boolean }) {
    const parsedInput = QuizFromScanActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
    return handleAction(parsedInput.data, generateQuizFromScan, isPremium);
}


// Schema for getBibleVerseAction
const BibleVerseActionInputSchema = z.object({
    topic: z.string().optional(),
    isPremium: z.boolean().optional(),
});
export async function getBibleVerseAction(input: GetBibleVerseInput & { isPremium?: boolean }) {
    const parsedInput = BibleVerseActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
    return handleAction(flowInput, getBibleVerse, isPremium);
}


// Schema for getFlashcardsAction
const FlashcardsActionInputSchema = z.object({
    topic: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    numFlashcards: z.number(),
    isPremium: z.boolean().optional(),
});
export async function getFlashcardsAction(input: GenerateFlashcardsInput & { isPremium?: boolean }) {
    const parsedInput = FlashcardsActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
    return handleAction(flowInput, generateFlashcards, isPremium);
}

// Schema for getFriendlyAdviceAction
const FriendlyAdviceActionInputSchema = z.object({
    question: z.string(),
    isPremium: z.boolean().optional(),
});
export async function getFriendlyAdviceAction(input: GetFriendlyAdviceInput & { isPremium?: boolean }) {
    const parsedInput = FriendlyAdviceActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    const { isPremium, ...flowInput } = parsedInput.data;
    return handleAction(flowInput, getFriendlyAdvice, isPremium);
}
