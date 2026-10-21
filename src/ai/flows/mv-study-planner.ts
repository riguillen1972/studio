import { ai, smartGenerate, getModel, type SupportedModel } from "../genkit";
import { z } from "zod";

export const MVPlannerInput = z.object({
  model: z.string().optional(), // set by the server from the student\'s plan
  subject: z.string(),
  examDate: z.string(),
  currentGrade: z.string(),
  targetGrade: z.string(),
  groundingContext: z.string().optional(),
});

export const mvPlanner = ai.defineFlow(
  {
    name: "mvPlanner",
    inputSchema: MVPlannerInput,
    outputSchema: z.object({
      totalTokens: z.number().optional(),
      plan: z.array(z.object({
        day: z.string(),
        topic: z.string(),
        durationMinutes: z.number(),
        focus: z.string()
      })),
      advice: z.string()
    }),
  },
  async ({ subject, examDate, currentGrade, targetGrade, groundingContext, model }) => {
    let prompt = `
    You are the Minimum Viable Study Planner. The student needs the smallest possible study plan to get from their current grade to their target grade by the exam date.
    
    Subject: ${subject}
    Exam Date: ${examDate}
    Current Grade: ${currentGrade}
    Target Grade: ${targetGrade}
    
    Prioritize high-yield topics. Cut out fluff.
    `;

    if (groundingContext) {
      prompt += `\n\nAdditionally, use the following teacher-provided Context Pack to ensure the plan covers exactly what is expected:\n${groundingContext}`;
    }

    const { output, usage } = await smartGenerate({
      model: getModel(model as SupportedModel),
      prompt: prompt,
      output: {
        schema: z.object({
          plan: z.array(z.object({
            day: z.string(),
            topic: z.string(),
            durationMinutes: z.number(),
            focus: z.string()
          })),
          advice: z.string()
        })
      }
    });

    if (!output) throw new Error("Failed to generate MV study plan.");
    return { ...output, totalTokens: usage.totalTokens ?? 0 };
  }
);
