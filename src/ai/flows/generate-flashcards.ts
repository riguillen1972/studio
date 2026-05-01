
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating flashcards.
 *
 * It takes a topic, subject, and grade level, and returns a set of flashcards.
 *
 * @interface GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * @interface GenerateFlashcardsOutput - The output type for the generateFlashcards function.
 * @function generateFlashcards - The main function that orchestrates the flashcard generation flow.
 */

import {ai, getModel, safetySettings, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().describe('The topic for the flashcards.'),
  subject: z.string().describe('The subject of the flashcards.'),
  gradeLevel: z.string().describe('The grade level of the student.'),
  numFlashcards: z.number().int().min(5).max(20).describe('The number of flashcards to generate.'),
  model: z.enum(['gemma3', 'flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
    front: z.string().describe("The front of the flashcard (term or question)."),
    back: z.string().describe("The back of the flashcard (definition or answer)."),
});

const FlashcardsSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of flashcards.'),
});

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema),
  totalTokens: z.number(),
});

export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const prompt = `You are an AI that generates educational flashcards for a student in grade ${input.gradeLevel}.

    The student wants flashcards on the topic of "${input.topic}" in the subject of ${input.subject}.
    
    Please generate ${input.numFlashcards} flashcards. Each flashcard should have a 'front' (a key term or question) and a 'back' (the corresponding definition or answer).
    
    Make sure the content is appropriate for the specified grade level.
    `;
    const response = await ai.generate({
        model: getModel(input.model),
        prompt: prompt,
        output: {
            schema: FlashcardsSchema,
        },
        config: {
            safetySettings,
        }
    });

    return {
      ...response.output!,
      totalTokens: response.usage.totalTokens ?? 0,
    };
  }
);
