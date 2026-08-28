import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from '@genkit-ai/anthropic';
import type { z } from 'genkit';

// --- MODEL DEFINITIONS ---
export const gemmaLite    = 'googleai/gemini-2.5-flash-lite';
export const geminiFlash  = 'googleai/gemini-2.5-flash';
export const geminiPro    = 'googleai/gemini-2.5-pro';
export const claudeHaiku  = 'anthropic/claude-haiku-4-5';

export type SupportedModel = 'free' | 'pro' | 'max' | 'gemma3' | 'flash' | 'haiku';

/**
 * Helper function to get the appropriate model string.
 * @param model The model identifier.
 * @returns The full model string for the Genkit API.
 */
export function getModel(model: SupportedModel = 'free'): string {
  switch (model) {
    case 'pro':
    case 'flash':
      return geminiFlash;    // Gemini 2.5 Flash
    case 'max':
      return geminiPro;      // Gemini 2.5 Pro
    case 'haiku':
      return claudeHaiku;    // Claude Haiku
    case 'gemma3':
    case 'free':
    default:
      return gemmaLite;      // free
  }
}

/** Check if a model string refers to a Claude/Anthropic model */
export function isClaudeModel(model: string): boolean {
  return model.startsWith('anthropic/');
}

// --- SAFETY SETTINGS ---
export const safetySettings: Array<{ category: string; threshold: string }> = [
  { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HARASSMENT',          threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',   threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',   threshold: 'BLOCK_ONLY_HIGH' },
];

// --- CONFIGURATION ---
export const ai = genkit({
  plugins: [googleAI(), anthropic()],
  model: gemmaLite,
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
}): Promise<{ output: T | null; text: string; usage: { totalTokens?: number } }> {
  const modelStr = opts.model;
  const isClaude = isClaudeModel(modelStr);

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
      config: isClaude ? {} : opts.config, // skip safetySettings for Claude
    });

    let parsed: T | null = null;
    try {
      // Strip any markdown code fences if present
      let text = response.text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }
      parsed = JSON.parse(text) as T;
    } catch {
      // If JSON parsing fails, return the raw text
      parsed = null;
    }

    return {
      output: parsed,
      text: response.text,
      usage: { totalTokens: response.usage.totalTokens ?? 0 },
    };
  }

  // For Gemini: use native structured output
  const response = await ai.generate({
    model: modelStr,
    prompt: opts.prompt,
    output: opts.output,
    config: opts.config,
  });

  return {
    output: response.output ?? null,
    text: response.text,
    usage: { totalTokens: response.usage.totalTokens ?? 0 },
  };
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
