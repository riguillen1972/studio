import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const KnowledgeGapInput = z.object({
  topic: z.string(),
  quizResults: z.array(z.object({
    question: z.string(),
    userAnswer: z.string(),
    correctAnswer: z.string(),
    isCorrect: z.boolean()
  })),
  groundingContext: z.string().optional(),
});

export const knowledgeGap = ai.defineFlow(
  {
    name: "knowledgeGap",
    inputSchema: KnowledgeGapInput,
    outputSchema: z.object({
      weakAreas: z.array(z.string()),
      studyPlan: z.array(z.object({
        topic: z.string(),
        actionItem: z.string()
      }))
    }),
  },
  async ({ topic, quizResults, groundingContext }) => {
    let prompt = `
    You are the Knowledge Gap Scanner. Analyze the following diagnostic quiz results for the topic "${topic}".
    Identify specific weak areas where the student answered incorrectly, and build a targeted study plan.
    
    Quiz Results:
    ${JSON.stringify(quizResults, null, 2)}
    `;

    if (groundingContext) {
      prompt += `\n\nAdditionally, tailor the study plan to the following teacher-provided Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          weakAreas: z.array(z.string()),
          studyPlan: z.array(z.object({
            topic: z.string(),
            actionItem: z.string()
          }))
        })
      }
    });

    if (!output) throw new Error("Failed to generate knowledge gap analysis.");
    return output;
  }
);
