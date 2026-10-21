import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const ProfessorModeInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  topic: z.string(),
  question: z.string(),
  groundingContext: z.string().optional(),
});

export const professorMode = ai.defineFlow(
  {
    name: "professorMode",
    inputSchema: ProfessorModeInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      answer: z.string(),
      furtherReading: z.array(z.string())
    }),
  },
  async ({ topic, question, groundingContext, model }) => {
    let prompt = `
    You are in Professor Mode. The user has an advanced, high-level question about "${topic}".
    Question: "${question}"
    
    Provide an academic, highly detailed, and rigorous answer. Assume the user has a strong baseline understanding.
    Suggest 2-3 specific further readings or concepts they should explore.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your response aligns with this Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          answer: z.string(),
          furtherReading: z.array(z.string())
        })
      }
    });

    if (!output) throw new Error("Failed to generate Professor Mode response.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
