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
import { webTutor, WebTutorInput } from "@/ai/flows/web-tutor";
import { SupportedModel } from "@/ai/genkit";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory rate limiter (per-user, per-minute)
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

// Helper function to verify authentication server-side
async function requireAuth(): Promise<{ userId: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { error: "Unauthorized. Please sign in." };
    }
    return { userId: user.id };
  } catch {
    return { error: "Authentication check failed." };
  }
}

// Helper function to handle action execution with auth and error handling
async function handleAction<T_Input, T_Output>(
  input: T_Input,
  flow: (input: T_Input) => Promise<T_Output>,
  rateLimitKey?: string
): Promise<{ success: true; data: T_Output } | { success: false; error: string }> {
  try {
    // Server-side authentication check
    const auth = await requireAuth();
    if ('error' in auth) {
      return { success: false as const, error: auth.error };
    }

    // Server-side rate limiting (keyed per user)
    const key = `${auth.userId}:${rateLimitKey || 'action'}`;
    if (!checkRateLimit(key)) {
      return { success: false as const, error: "Rate limit exceeded. Please wait a moment and try again." };
    }

    const result = await flow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI action failed:", error);
    return { success: false as const, error: "An error occurred while processing your request." };
  }
}

const modelSchema = z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional();

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
    model: modelSchema,
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
    model: modelSchema,
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

// --- Web Tutor ---

// SSRF protection: block internal/private IP ranges and dangerous URLs
function isUrlSafe(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    
    // Only allow http and https schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
      return false;
    }

    // Block private IP ranges
    const ipParts = hostname.split('.').map(Number);
    if (ipParts.length === 4 && ipParts.every(p => !isNaN(p))) {
      // 10.x.x.x
      if (ipParts[0] === 10) return false;
      // 172.16-31.x.x
      if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return false;
      // 192.168.x.x
      if (ipParts[0] === 192 && ipParts[1] === 168) return false;
      // 169.254.x.x (link-local / cloud metadata)
      if (ipParts[0] === 169 && ipParts[1] === 254) return false;
      // 0.x.x.x
      if (ipParts[0] === 0) return false;
    }

    // Block common cloud metadata endpoints
    if (hostname === 'metadata.google.internal' || hostname === 'metadata.google.com') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function fetchPageContent(url: string): Promise<string> {
  if (!isUrlSafe(url)) {
    throw new Error("This URL is not allowed. Please use a public website URL.");
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'StudyBuddyAI/1.0 (Educational Bot)' },
      signal: AbortSignal.timeout(10000),
      redirect: 'manual', // Don't follow redirects to internal IPs
    });

    // If redirected, validate the redirect target too
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl && !isUrlSafe(redirectUrl)) {
        throw new Error("Redirect target is not allowed.");
      }
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    // Strip HTML tags, scripts, styles and extract text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
    // Limit content length to prevent excessive token usage
    return text.slice(0, 50000);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not allowed')) {
      throw error;
    }
    throw new Error(`Could not fetch the webpage. Make sure the URL is correct and the site is publicly accessible.`);
  }
}

const WebTutorActionInputSchema = z.object({
  url: z.string().url(),
  question: z.string(),
  conversationHistory: z.array(z.object({ role: z.enum(['user', 'ai']), content: z.string() })).optional(),
  model: modelSchema,
});
export async function webTutorAction(input: { url: string; question: string; conversationHistory?: { role: 'user' | 'ai'; content: string }[]; model?: SupportedModel }) {
  const parsedInput = WebTutorActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false as const, error: "Invalid input. Please provide a valid URL and question." };
  }

  // Auth check
  const auth = await requireAuth();
  if ('error' in auth) {
    return { success: false as const, error: auth.error };
  }

  const key = `${auth.userId}:webTutor`;
  if (!checkRateLimit(key)) {
    return { success: false as const, error: "Rate limit exceeded. Please wait a moment and try again." };
  }

  try {
    const pageContent = await fetchPageContent(parsedInput.data.url);
    const result = await webTutor({
      url: parsedInput.data.url,
      pageContent,
      question: parsedInput.data.question,
      conversationHistory: parsedInput.data.conversationHistory,
      model: parsedInput.data.model,
    });
    return { success: true as const, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred.";
    return { success: false as const, error: errorMessage };
  }
}

