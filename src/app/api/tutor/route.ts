import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateExplanation } from '@/ai/flows/generate-explanation';
import { SupportedModel } from '@/ai/genkit';
import { corsHeaders, handleOptions, checkRateLimit } from '@/lib/api-utils';

export async function OPTIONS() {
  return handleOptions();
}

const modelSchema = z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional();

const ExplanationActionInputSchema = z.object({
  concept: z.string(),
  model: modelSchema,
  careerField: z.string().optional(),
  conversationHistory: z.array(z.object({ role: z.enum(['user', 'ai']), content: z.string() })).optional(),
  mode: z.enum(['help', 'research']).optional(),
});

export async function POST(req: Request) {
  try {
    if (!checkRateLimit('tutor')) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const parsedInput = ExplanationActionInputSchema.safeParse(body);
    
    if (!parsedInput.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input.", details: parsedInput.error.format() },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await generateExplanation(parsedInput.data);
    return NextResponse.json({ success: true, data: result }, { headers: corsHeaders });
  } catch (error) {
    console.error("AI action failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
