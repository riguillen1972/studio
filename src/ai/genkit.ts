import {genkit, ModelReference} from 'genkit';
import {googleAI, GoogleAIGenerateRequestConfig} from '@genkit-ai/google-genai';

const geminiFlash = 'googleai/gemini-2.5-flash';
const geminiPro = 'googleai/gemini-2.5-pro';


type StudyBuddyModel = ModelReference;
export type SupportedModel = 'flash' | 'pro';

const models: {[key in SupportedModel]: StudyBuddyModel} = {
    flash: geminiFlash,
    pro: geminiPro,
}

export const safetySettings: GoogleAIGenerateRequestConfig["safetySettings"] = [
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
    },
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
    }
];

export function getModel(model: SupportedModel = 'flash') {
    return models[model] || models.flash;
}

const plugins = [googleAI()];

export const ai = genkit({
  plugins,
  model: geminiFlash,
});
