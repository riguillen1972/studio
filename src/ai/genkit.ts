import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from 'genkitx-anthropic';

// --- MODEL DEFINITIONS ---
const geminiFlash = 'googleai/gemini-2.5-flash';
const geminiPro = 'googleai/gemini-2.5-pro';
const claudeHaiku = 'anthropic/claude-3-haiku';

export type SupportedModel = 'flash' | 'pro' | 'haiku';

/**
 * Helper function to get the appropriate model string.
 * @param model The model identifier ('flash', 'pro', or 'haiku').
 * @returns The full model string for the Genkit API.
 */
export function getModel(model: SupportedModel = 'flash'): string {
  if (model === 'pro') {
    return geminiPro;
  }
  if (model === 'haiku') {
    return claudeHaiku;
  }
  return geminiFlash;
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
