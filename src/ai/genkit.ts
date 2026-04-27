import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from 'genkitx-anthropic';

// --- MODEL DEFINITIONS ---
const gemma3Model = 'googleai/gemma-3-1b';
const geminiFlash = 'googleai/gemini-2.5-flash';
const geminiPro = 'googleai/gemini-2.5-pro';
const claudeHaiku = 'anthropic/claude-3-haiku';

export type SupportedModel = 'gemma3' | 'flash' | 'pro' | 'haiku';

/**
 * Helper function to get the appropriate model string.
 * @param model The model identifier.
 * @returns The full model string for the Genkit API.
 */
export function getModel(model: SupportedModel = 'flash'): string {
  switch (model) {
    case 'pro': return geminiPro;
    case 'haiku': return claudeHaiku;
    case 'gemma3': return gemma3Model;
    default: return geminiFlash;
  }
}

// --- SAFETY SETTINGS ---
export const safetySettings: Array<{ category: string; threshold: string }> = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
];

// --- CONFIGURATION ---
export const ai = genkit({
  plugins: [googleAI(), anthropic()],
  model: geminiFlash,
});
