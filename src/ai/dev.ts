import { config } from 'dotenv';
config();

import '@/ai/flows/generate-explanation.ts';
import '@/ai/flows/provide-homework-hints.ts';
import '@/ai/flows/summarize-text.ts';
import '@/ai/flows/scan-homework-flow.ts';
