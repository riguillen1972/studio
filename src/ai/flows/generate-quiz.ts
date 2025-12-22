'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a multiple-choice quiz.
 *
 * It takes a topic, subject, and grade level, and returns a set of quiz questions.
 *
 * @interface GenerateQuizInput - The input type for the generateQuiz function.
 * @interface GenerateQuizOutput - The output type for the generateQuiz function.
 * @function generateQuiz - The main function that orchestrates the quiz generation flow.
 */

import {ai, getModel} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz.'),
  subject: z.string().describe('The subject of the quiz.'),
  gradeLevel: z.string().describe('The grade level of the student.'),
  numQuestions: z.number().int().min(1).max(10).describe('The number of questions to generate.'),
});

export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe("The quiz question."),
    options: z.array(z.string()).describe("An array of 4 multiple-choice options."),
    answer: z.string().describe("The correct answer from the options."),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});

export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput, isPremium: boolean = false): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input, isPremium);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input, streamingCallback, isPremium) => {
    const prompt = `You are an AI that generates educational quizzes for a student in grade ${input.gradeLevel}.

    The student wants a quiz on the topic of "${input.topic}" in the subject of ${input.subject}.
    
    Please generate ${input.numQuestions} multiple-choice questions. Each question should have exactly 4 options. One of the options must be the correct answer.
    
    Make sure the questions are appropriate for the specified grade level.
    `;
    const {output} = await ai.generate({
        model: getModel(isPremium),
        prompt: prompt,
        output: {
            schema: GenerateQuizOutputSchema,
        },
    });
    return output;
  }
);
