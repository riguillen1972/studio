import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const MetacognitionInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  topic: z.string(),
  studyMethod: z.string(),
  groundingContext: z.string().optional(),
});

export const metacognition = ai.defineFlow(
  {
    name: "metacognition",
    inputSchema: MetacognitionInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      reflectionQuestions: z.array(z.string()),
      optimizationAdvice: z.string()
    }),
  },
  async ({ topic, studyMethod, groundingContext, model }) => {
    let prompt = `
    You are the Metacognition Coach. The user is studying "${topic}" using this method: "${studyMethod}".
    Help them think about HOW they are thinking.
    
    Provide 3 deep reflection questions to test if their study method is actually working.
    Provide 1 piece of actionable advice to optimize their learning approach.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your advice is relevant to this Context Pack:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          reflectionQuestions: z.array(z.string()),
          optimizationAdvice: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate Metacognition response.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
