import { ai, geminiFlash } from "../genkit";
import { z } from "zod";

export const MetacognitionInput = z.object({
  topic: z.string(),
  studyMethod: z.string(),
  groundingContext: z.string().optional(),
});

export const metacognition = ai.defineFlow(
  {
    name: "metacognition",
    inputSchema: MetacognitionInput,
    outputSchema: z.object({
      reflectionQuestions: z.array(z.string()),
      optimizationAdvice: z.string()
    }),
  },
  async ({ topic, studyMethod, groundingContext }) => {
    let prompt = `
    You are the Metacognition Coach. The user is studying "${topic}" using this method: "${studyMethod}".
    Help them think about HOW they are thinking.
    
    Provide 3 deep reflection questions to test if their study method is actually working.
    Provide 1 piece of actionable advice to optimize their learning approach.
    `;

    if (groundingContext) {
      prompt += `\n\nEnsure your advice is relevant to this Context Pack:\n${groundingContext}`;
    }

    const { output } = await ai.generate({
      model: geminiFlash,
      prompt: prompt,
      output: {
        schema: z.object({
          reflectionQuestions: z.array(z.string()),
          optimizationAdvice: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate Metacognition response.");
    return output;
  }
);
