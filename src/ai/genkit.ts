import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// --- MODEL DEFINITIONS ---
// Standard stable identifiers for Genkit 1.x
const geminiFlash = 'googleai/gemini-1.5-flash';
const geminiPro = 'googleai/gemini-1.5-pro';

export type SupportedModel = 'flash' | 'pro';

/**
 * Helper function to get the appropriate model string.
 * @param model The model identifier ('flash' or 'pro').
 * @returns The full model string for the Genkit API.
 */
export function getModel(model: SupportedModel = 'flash'): string {
  if (model === 'pro') {
    return geminiPro;
  }
  return geminiFlash;
}

// --- SAFETY SETTINGS ---
export const safetySettings: any = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
];

// --- CONFIGURATION ---
export const ai = genkit({
  plugins: [googleAI()],
  model: geminiFlash,
});
