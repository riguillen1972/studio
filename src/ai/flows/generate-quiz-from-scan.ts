
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a multiple-choice quiz from an image of educational material.
 *
 * It takes an image, subject, and grade level, and returns a set of quiz questions based on the content of the image.
 *
 * @interface GenerateQuizFromScanInput - The input type for the generateQuizFromScan function.
 * @interface GenerateQuizFromScanOutput - The output type for the generateQuizFromScan function.
 * @function generateQuizFromScan - The main function that orchestrates the quiz generation flow from a scan.
 */

import {ai, getModel, SupportedModel} from '@/ai/genkit';
import {z} from 'genkit';

const QuizQuestionSchema = z.object({
    question: z.string().describe("The quiz question."),
    options: z.array(z.string()).describe("An array of 4 multiple-choice options."),
    answer: z.string().describe("The correct answer from the options."),
});

const QuizFromScanSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
  topic: z.string().describe('The topic of the generated quiz based on the document.')
});

const GenerateQuizFromScanOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema),
  topic: z.string(),
  totalTokens: z.number(),
});
export type GenerateQuizFromScanOutput = z.infer<typeof GenerateQuizFromScanOutputSchema>;


const GenerateQuizFromScanInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the educational material, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  subject: z.string().describe('The subject of the quiz.'),
  gradeLevel: z.string().describe('The grade level of the student.'),
  numQuestions: z.number().int().min(1).max(10).describe('The number of questions to generate.'),
  model: z.enum(['flash', 'pro', 'haiku'] as [SupportedModel, ...SupportedModel[]]).optional(),
});

export type GenerateQuizFromScanInput = z.infer<typeof GenerateQuizFromScanInputSchema>;


export async function generateQuizFromScan(input: GenerateQuizFromScanInput): Promise<GenerateQuizFromScanOutput> {
  return generateQuizFromScanFlow(input);
}

const generateQuizFromScanFlow = ai.defineFlow(
  {
    name: 'generateQuizFromScanFlow',
    inputSchema: GenerateQuizFromScanInputSchema,
    outputSchema: GenerateQuizFromScanOutputSchema,
  },
  async (input) => {
    const prompt = `You are an AI that generates educational quizzes for a student in grade ${input.gradeLevel}.

    The student has provided an image of their study material for the subject of ${input.subject}.
    
    Analyze the content of the image and identify the main topic. Then, generate ${input.numQuestions} multiple-choice questions based *only* on the information present in the image. Each question should have exactly 4 options. One of the options must be the correct answer.
    
    Here is the image:
    {{media url=${input.photoDataUri}}}
    
    Make sure the questions are appropriate for the specified grade level.
    `;

    const response = await ai.generate({
        model: getModel(input.model),
        prompt: prompt,
        output: {
            schema: QuizFromScanSchema
        }
    });

    return {
      ...response.output!,
      totalTokens: response.usage.totalTokens,
    };
  }
);
