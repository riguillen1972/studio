import { NextResponse } from 'next/server';
import { z } from 'zod';
import { scanHomework } from '@/ai/flows/scan-homework-flow';
import { SupportedModel } from '@/ai/genkit';
import { corsHeaders, handleOptions, checkRateLimit } from '@/lib/api-utils';

export async function OPTIONS() {
  return handleOptions();
}

const modelSchema = z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional();

const HomeworkScanActionInputSchema = z.object({
  photoDataUri: z.string(),
  question: z.string(),
  subject: z.string(),
  gradeLevel: z.string(),
  model: modelSchema,
});

export async function POST(req: Request) {
  try {
    if (!checkRateLimit('scan')) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const parsedInput = HomeworkScanActionInputSchema.safeParse(body);
    
    if (!parsedInput.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input.", details: parsedInput.error.format() },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await scanHomework(parsedInput.data);
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
