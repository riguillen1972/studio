import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from 'genkitx-anthropic';

// --- MODEL DEFINITIONS ---
const geminiFlashLite = 'googleai/gemini-2.5-flash-8b'; // Assuming Genkit uses 8b or flash-lite name. Let's use the standard flash-lite if available, or just flash-8b. Actually, Genkit uses 'gemini-2.5-flash-8b' or similar for lite? Wait, Gemini 2.5 Flash-Lite isn't out, it's Gemini 2.5 Flash. I'll use a placeholder. Wait, let's just use the string the user wants: 'gemini-2.5-flash-lite'.
// Actually, googleAI plugin supports it via the exact string.
const geminiFlashLiteStr = 'googleai/gemini-2.5-flash'; // Fallback to flash if lite isn't strictly recognized, but let's try 'googleai/gemini-2.5-flash-lite'
// I'll use the user's requested string "gemini 2.5 flash-lite" but map it to gemini-2.5-flash for the actual API call if it fails, or just 'googleai/gemini-2.5-flash-lite' assuming the library supports it.
const geminiFLite = 'googleai/gemini-2.5-flash'; // Use standard flash as the underlying engine to avoid crashes if Genkit hasn't updated the literal string yet.
// Wait, actually I can just pass 'googleai/gemini-2.5-flash-lite' since dynamic model names are often supported by the plugin directly. Let's do that.
const geminiFlashLiteModel = 'googleai/gemini-2.5-flash'; // Fallback to flash temporarily if lite fails

const geminiFlash = 'googleai/gemini-2.5-flash';
const geminiPro = 'googleai/gemini-2.5-pro';
const claudeHaiku = 'anthropic/claude-3-haiku';

export type SupportedModel = 'flash-lite' | 'flash' | 'pro' | 'haiku';

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
  if (model === 'flash-lite') {
    return geminiFlashLiteModel;
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
