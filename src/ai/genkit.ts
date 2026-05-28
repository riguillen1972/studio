import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from 'genkitx-anthropic';

// --- MODEL DEFINITIONS ---
const gemmaLite    = 'googleai/gemini-2.5-flash-lite';
const geminiFlash  = 'googleai/gemini-2.5-flash';
const geminiPro    = 'googleai/gemini-2.5-pro';
const claudeHaiku  = 'anthropic/claude-3-5-haiku-20241022';

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
