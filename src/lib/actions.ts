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
import { SupportedModel } from "@/ai/genkit";

// Helper function to handle action execution and error handling
async function handleAction<T_Input, T_Output>(
  input: T_Input,
  flow: (input: T_Input) => Promise<T_Output>
): Promise<{ success: true; data: T_Output } | { success: false; error: string }> {
  try {
    // In a real app, you'd have robust server-side validation here.
    const result = await flow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI action failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

const modelSchema = z.enum(['flash', 'pro'] as [SupportedModel, ...SupportedModel[]]).optional();

// Schema for getExplanationAction
const ExplanationActionInputSchema = z.object({
  concept: z.string(),
  model: modelSchema,
});
export async function getExplanationAction(input: GenerateExplanationInput) {
  const parsedInput = ExplanationActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  return handleAction(parsedInput.data, generateExplanation);
}

// Schema for getHomeworkHintsAction
const HomeworkHintsActionInputSchema = z.object({
  problem: z.string(),
  subject: z.string(),
  gradeLevel: z.string(),
  model: modelSchema,
});
export async function getHomeworkHintsAction(input: ProvideHomeworkHintsInput) {
    const parsedInput = HomeworkHintsActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return { success: false, error: "Invalid input." };
    }
  return handleAction(parsedInput.data, provideHomeworkHints);
}

// Schema for getSummaryAction
const SummaryActionInputSchema = z.object({
  text: z.string(),
  model: modelSchema,
});
export async function getSummaryAction(input: SummarizeTextInput) {
    const parsedInput = SummaryActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
  return handleAction(parsedInput.data, summarizeText);
}

// Schema for getHomeworkScanAction
const HomeworkScanActionInputSchema = z.object({
    photoDataUri: z.string(),
    question: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    model: modelSchema,
});
export async function getHomeworkScanAction(input: ScanHomeworkInput) {
    const parsedInput = HomeworkScanActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, scanHomework);
}

// Schema for getQuizAction
const QuizActionInputSchema = z.object({
    topic: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    numQuestions: z.number(),
    model: modelSchema,
});
export async function getQuizAction(input: GenerateQuizInput) {
    const parsedInput = QuizActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, generateQuiz);
}

// Schema for getQuizFromScanAction
const QuizFromScanActionInputSchema = z.object({
    photoDataUri: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    numQuestions: z.number(),
    model: modelSchema,
});
export async function getQuizFromScanAction(input: GenerateQuizFromScanInput) {
    const parsedInput = QuizFromScanActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, generateQuizFromScan);
}


// Schema for getBibleVerseAction
const BibleVerseActionInputSchema = z.object({
    topic: z.string().optional(),
    model: modelSchema,
});
export async function getBibleVerseAction(input: GetBibleVerseInput) {
    const parsedInput = BibleVerseActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, getBibleVerse);
}


// Schema for getFlashcardsAction
const FlashcardsActionInputSchema = z.object({
    topic: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    numFlashcards: z.number(),
    model: modelSchema,
});
export async function getFlashcardsAction(input: GenerateFlashcardsInput) {
    const parsedInput = FlashcardsActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, generateFlashcards);
}

// Schema for getFriendlyAdviceAction
const FriendlyAdviceActionInputSchema = z.object({
    question: z.string(),
    model: modelSchema,
});
export async function getFriendlyAdviceAction(input: GetFriendlyAdviceInput) {
    const parsedInput = FriendlyAdviceActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, getFriendlyAdvice);
}
