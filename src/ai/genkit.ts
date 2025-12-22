import {genkit, ModelReference} from 'genkit';
import {googleAI, GoogleAIGenerateRequestConfig} from '@genkit-ai/google-genai';

const geminiFlash = 'googleai/gemini-2.5-flash';
const geminiPro = 'googleai/gemini-1.5-pro-latest';


type StudyBuddyModel = ModelReference<GoogleAIGenerateRequestConfig>;

const models: {[key: string]: StudyBuddyModel} = {
    free: geminiFlash,
    premium: geminiPro
}

export function getModel(isPremium: boolean = false) {
    return models[isPremium ? 'premium' : 'free'];
}

export const ai = genkit({
  plugins: [googleAI()],
  model: geminiFlash,
});
