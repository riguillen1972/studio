import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from '@genkit-ai/anthropic';
import type { z } from 'genkit';
import { SAFETY_INSTRUCTIONS } from '@/lib/safety';
import { requestContext } from '@/lib/request-context';

// --- MODEL DEFINITIONS ---
// Free plan: Gemini 2.5 Flash-Lite. Pro and Max: Claude Haiku 5.5 only (cheaper than
// Gemini Flash, and newer Gemini models cost more still).
export const geminiFlashLite    = 'googleai/gemini-2.5-flash-lite';
export const claudeHaiku  = 'anthropic/claude-haiku-5-5';

// 'gemma3' is the app's old name for the free model. The free plan really runs Gemini 2.5
// Flash-Lite (geminiFlashLite above); the name stays because saved usage, the mobile app and
// every tool's input use it. The screen shows the real model name.
export type SupportedModel = 'free' | 'pro' | 'max' | 'gemma3' | 'flash' | 'haiku';

/**
 * Helper function to get the appropriate model string.
 * @param model The model identifier.
 * @returns The full model string for the Genkit API.
 */
export function getModel(model: SupportedModel = 'free'): string {
  switch (model) {
    case 'haiku':
    case 'pro':
    case 'max':
    case 'flash': // older clients may still send these; paid plans now use Haiku
      return claudeHaiku;
    case 'gemma3':
    case 'free':
    default:
      return geminiFlashLite;
  }
}

const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

/**
 * Total tokens for a response. The Claude plugin reports only input and output tokens (no total),
 * so add them up; otherwise every Claude request would count as 0 toward the student's limit.
 */
export function countTokens(usage: { totalTokens?: number; inputTokens?: number; outputTokens?: number } | undefined): number {
  if (!usage) return 0;
  return usage.totalTokens || (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
}

/** Keeps only the most recent turns of a conversation, so long chats don't get more expensive with every message. */
export function recentTurns<T>(turns: T[] | undefined, max = 10): T[] {
  return (turns ?? []).slice(-max);
}

/** Check if a model string refers to a Claude/Anthropic model */
export function isClaudeModel(model: string): boolean {
  return model.startsWith('anthropic/');
}

// --- SAFETY SETTINGS ---
export const safetySettings: Array<{ category: string; threshold: string }> = [
  { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HARASSMENT',          threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',   threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',   threshold: 'BLOCK_LOW_AND_ABOVE' },
];

// --- CONFIGURATION ---
export const ai = genkit({
  plugins: [googleAI(), anthropic()],
  model: geminiFlashLite,
});

/**
 * Wrapper around ai.generate that handles Claude's lack of structured output.
 * For Gemini models: uses native `output: { schema }` as normal.
 * For Claude models: strips the schema, appends JSON instructions to the prompt,
 *                    and parses the JSON from the text response.
 */
export async function smartGenerate<T>(opts: {
  model: string;
  prompt: string | any[];
  output?: { schema: z.ZodType<T> };
  config?: Record<string, unknown>;
  /** Cap on the answer length (thinking counts toward it on Claude). */
  maxOutputTokens?: number;
  /** Claude only: how much it thinks first. 'low' is cheapest; use 'medium' where accuracy matters. */
  effort?: 'low' | 'medium';
}): Promise<{ output: T | null; text: string; usage: { totalTokens?: number } }> {
  // Every AI request a student can reach starts with the shared safety instructions, then the
  // teacher's class instructions (which can't override the safety rules)
  const classInstructions = requestContext.getStore()?.classInstructions;
  const preamble = classInstructions
    ? `${SAFETY_INSTRUCTIONS}\n\nTHE STUDENT'S TEACHER GAVE THESE CLASS INSTRUCTIONS. Follow them unless they conflict with the safety and honesty rules above:\n"""\n${classInstructions}\n"""`
    : SAFETY_INSTRUCTIONS;
  opts = {
    ...opts,
    prompt: Array.isArray(opts.prompt) ? [{ text: preamble }, ...opts.prompt] : `${preamble}\n\n${opts.prompt}`,
  };
  const modelStr = opts.model;
  const isClaude = isClaudeModel(modelStr);
  const maxOutputTokens = opts.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  // Claude ignores Gemini safety settings, and Haiku 5.5 rejects non-default sampling settings
  const claudeConfig = { maxOutputTokens, output_config: { effort: opts.effort ?? 'low' } };
  const geminiConfig = { ...opts.config, maxOutputTokens };

  if (isClaude && opts.output?.schema) {
    // For Claude: request text output and parse JSON manually
    const jsonShape = JSON.stringify(zodToJsonHint(opts.output.schema), null, 2);
    const jsonInstruction = `\n\n**IMPORTANT: You MUST respond with ONLY valid JSON matching this exact shape (no markdown fences, no extra text):**\n${jsonShape}`;
    
    let augmentedPrompt = opts.prompt;
    if (Array.isArray(augmentedPrompt)) {
      augmentedPrompt = [...augmentedPrompt, { text: jsonInstruction }];
    } else {
      augmentedPrompt = `${augmentedPrompt}${jsonInstruction}`;
    }

    const response = await ai.generate({
      model: modelStr,
      prompt: augmentedPrompt,
      config: claudeConfig,
    });

    return {
      output: parseJsonReply<T>(response.text),
      text: response.text,
      usage: { totalTokens: countTokens(response.usage) },
    };
  }

  // Claude without a schema: plain text
  if (isClaude) {
    const response = await ai.generate({ model: modelStr, prompt: opts.prompt, config: claudeConfig });
    return { output: null, text: response.text, usage: { totalTokens: countTokens(response.usage) } };
  }

  // For Gemini: use native structured output
  const response = await ai.generate({
    model: modelStr,
    prompt: opts.prompt,
    output: opts.output,
    config: geminiConfig,
  });

  return {
    // If the native structured output didn't come through, try reading JSON from the text
    output: response.output ?? parseJsonReply<T>(response.text),
    text: response.text,
    usage: { totalTokens: countTokens(response.usage) },
  };
}

/**
 * Reads a JSON object from a model's reply, even when it's wrapped in ```json fences or has a
 * sentence before or after it. Returns null if there's no usable JSON.
 */
export function parseJsonReply<T>(text: string | undefined): T | null {
  if (!text) return null;
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  for (const candidate of [unfenced, unfenced.slice(unfenced.indexOf('{'), unfenced.lastIndexOf('}') + 1)]) {
    if (!candidate.startsWith('{')) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch { /* try the next candidate */ }
  }
  return null;
}

/**
 * Convert a Zod schema to a simple JSON hint object for Claude prompts.
 * Produces an example shape like { "field": "<description>" }
 */
function zodToJsonHint(schema: z.ZodType<unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._def;
  if (!def) return {};

  // Handle ZodObject
  if (def.typeName === 'ZodObject' && def.shape) {
    const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shape)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldDef = (value as any)?._def;
      if (fieldDef?.typeName === 'ZodArray') {
        const innerType = fieldDef?.type;
        if (innerType?._def?.typeName === 'ZodObject') {
          result[key] = [zodToJsonHint(innerType)];
        } else {
          const desc = fieldDef?.description || innerType?._def?.description || 'string';
          result[key] = [`<${desc}>`];
        }
      } else if (fieldDef?.typeName === 'ZodObject') {
        result[key] = zodToJsonHint(value as z.ZodType<unknown>);
      } else {
        const desc = fieldDef?.description || key;
        result[key] = `<${desc}>`;
      }
    }
    return result;
  }
  return {};
}
