// Worksheet shape and formatting, shared by the server and the browser.

export interface WorksheetQuestion {
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
}

export interface Worksheet {
  title: string;
  instructions: string;
  questions: WorksheetQuestion[];
}

const letter = (i: number) => String.fromCharCode(65 + i);

/** Student copy as Markdown (no answers). Used as the assignment's content. */
export function worksheetToStudentMarkdown(w: Worksheet): string {
  // Numbers are written out (not Markdown lists) so choices between questions don't restart the numbering
  const questions = w.questions.map((q, i) => {
    const choices = q.choices.map((c, j) => `\n${letter(j)}. ${c}`).join("");
    return `**${i + 1}.** ${q.prompt}${choices}`;
  });
  return `**${w.instructions}**\n\n${questions.join("\n\n")}`;
}

/** Answer key as Markdown. Stored in answer_key, which students can't read. */
export function worksheetToAnswerKey(w: Worksheet): string {
  return w.questions.map((q, i) => `${i + 1}. ${q.answer}${q.explanation ? ` (${q.explanation})` : ""}`).join("\n");
}
