
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from 'genkitx-anthropic'; 

// --- MODEL DEFINITIONS ---
const geminiFlash = 'googleai/gemini-1.5-flash-latest'; 
const claudeHaiku = 'anthropic/claude-3-5-haiku'; 

export type SupportedModel = 'flash' | 'pro';

const models: Record<SupportedModel, string> = {
    flash: geminiFlash,
    pro: claudeHaiku, // 'pro' is now the key for Claude Haiku
};

// --- SAFETY SETTINGS ---
export const safetySettings = [
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
    },
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
    }
];

// --- HELPER FUNCTION ---
// This allows you to easily switch models in your other files
export function getModel(model: SupportedModel = 'flash') {
    return models[model] || models.flash;
}

// --- PART 1: CONFIGURATION (The Engine Room) ---
export const ai = genkit({
  plugins: [
      // Plugin 1: Google
      googleAI(),
      // Plugin 2: Anthropic (Claude)
      // Make sure ANTHROPIC_API_KEY is in your .env file!
      anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }), 
  ],
  // Default fallback if no model is specified
  model: geminiFlash,
});
