"use server";

import { z } from "zod";
import { generateExplanation, GenerateExplanationInput } from "@/ai/flows/generate-explanation";
import { provideHomeworkHints, ProvideHomeworkHintsInput } from "@/ai/flows/provide-homework-hints";
import { summarizeText, SummarizeTextInput } from "@/ai/flows/summarize-text";
import { scanHomework, ScanHomeworkInput } from "@/ai/flows/scan-homework-flow";
import { generateQuiz, GenerateQuizInput } from "@/ai/flows/generate-quiz";


// Helper function to handle action execution and error handling
async function handleAction<T_Input, T_Output>(
  input: T_Input,
  flow: (input: T_Input) => Promise<T_Output>
): Promise<{ success: true; data: T_Output } | { success: false; error: string }> {
  try {
    const result = await flow(input);
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
});
export async function getQuizAction(input: GenerateQuizInput) {
    const parsedInput = QuizActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, generateQuiz);
}
