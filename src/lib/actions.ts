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
import { generateMiniApp, GenerateMiniAppInput } from "@/ai/flows/generate-mini-app";
import { interactWithMiniApp, InteractWithMiniAppInput } from "@/ai/flows/interact-with-mini-app";
import { runTool, RunToolInput } from "@/ai/flows/run-tool";
import { SupportedModel } from "@/ai/genkit";

// Simple in-memory rate limiter (per-action, per-minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // max requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Helper function to handle action execution and error handling
async function handleAction<T_Input, T_Output>(
  input: T_Input,
  flow: (input: T_Input) => Promise<T_Output>,
  rateLimitKey?: string
): Promise<{ success: true; data: T_Output } | { success: false; error: string }> {
  try {
    // Server-side rate limiting
    const key = rateLimitKey || 'global';
    if (!checkRateLimit(key)) {
      return { success: false as const, error: "Rate limit exceeded. Please wait a moment and try again." };
    }

    const result = await flow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI action failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false as const, error: errorMessage };
  }
}

const modelSchema = z.enum(['flash-lite', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional();

// Schema for getExplanationAction
const ExplanationActionInputSchema = z.object({
  concept: z.string(),
  model: modelSchema,
  careerField: z.string().optional(),
  conversationHistory: z.array(z.object({ role: z.enum(['user', 'ai']), content: z.string() })).optional(),
  mode: z.enum(['help', 'research']).optional(),
});
export async function getExplanationAction(input: GenerateExplanationInput) {
  const parsedInput = ExplanationActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false as const, error: "Invalid input." };
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
      return { success: false as const, error: "Invalid input." };
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
        return { success: false as const, error: "Invalid input." };
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
        return { success: false as const, error: "Invalid input." };
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
        return { success: false as const, error: "Invalid input." };
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
        return { success: false as const, error: "Invalid input." };
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
        return { success: false as const, error: "Invalid input." };
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
        return { success: false as const, error: "Invalid input." };
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
        return { success: false as const, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, getFriendlyAdvice);
}

// Schema for generateMiniAppAction
const MiniAppActionInputSchema = z.object({
    description: z.string(),
    model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
    allowLLM: z.boolean(),
});
export async function generateMiniAppAction(input: GenerateMiniAppInput) {
    const parsedInput = MiniAppActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false as const, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, generateMiniApp);
}

// Schema for interactWithMiniAppAction
const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'app']),
  content: z.string(),
});
const InteractActionInputSchema = z.object({
    appDescription: z.string(),
    conversationHistory: z.array(ConversationTurnSchema),
    userInput: z.string(),
    model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
    allowLLM: z.boolean(),
});
export async function interactWithMiniAppAction(input: InteractWithMiniAppInput) {
    const parsedInput = InteractActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false as const, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, interactWithMiniApp);
}

// Schema for runToolAction
const RunToolActionInputSchema = z.object({
    toolName: z.string(),
    toolDescription: z.string(),
    userInput: z.string(),
    model: modelSchema,
});
export async function runToolAction(input: RunToolInput) {
    const parsedInput = RunToolActionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false as const, error: "Invalid input." };
    }
    return handleAction(parsedInput.data, runTool);
}
