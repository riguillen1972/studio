import { ai, gemmaLite, geminiFlash } from "../genkit";
import { z } from "zod";

export const ExamOracleInput = z.object({
  materials: z.string(),
  groundingContext: z.string().optional(),
});

export const examOracle = ai.defineFlow(
  {
    name: "examOracle",
    inputSchema: ExamOracleInput,
    outputSchema: z.object({
      predictions: z.array(z.object({
        question: z.string(),
        likelihood: z.enum(["High", "Medium"]),
        explanation: z.string()
      }))
    }),
  },
  async ({ materials, groundingContext }) => {
    let prompt = `
    You are the Exam Oracle. Based on the provided syllabus or study materials, predict the most likely exam questions.
    Return 3 to 5 predicted questions, their likelihood (High or Medium), and a brief explanation of why it will likely be on the exam.
    
    Materials:
    ${materials}
    `;

    if (groundingContext) {
      prompt += `\n\nAdditionally, prioritize predicting questions based on the following teacher-provided Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          predictions: z.array(z.object({
            question: z.string(),
            likelihood: z.enum(["High", "Medium"]),
            explanation: z.string()
          }))
        })
      }
    });

    if (!output) throw new Error("Failed to generate exam predictions.");
    return output;
  }
);
