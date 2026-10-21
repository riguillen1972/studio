import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const PersonalityTutorInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  topic: z.string(),
  personality: z.enum(["pirate", "yoda", "shakespeare", "drill_sergeant", "chill_surfer"]),
  groundingContext: z.string().optional(),
});

export const personalityTutor = ai.defineFlow(
  {
    name: "personalityTutor",
    inputSchema: PersonalityTutorInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      explanation: z.string()
    }),
  },
  async ({ topic, personality, groundingContext, model }) => {
    let prompt = `
    You are an AI Tutor explaining "${topic}".
    You must adopt the following persona entirely: ${personality}.
    Do not break character. Make the explanation educational but highly entertaining.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your explanation covers the concepts from this Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          explanation: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate personality tutor response.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
