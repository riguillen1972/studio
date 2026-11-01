// The printed worksheet itself: questions with room for work, then an optional answer key page.

export interface WorksheetQuestion {
  id: string; kind: "multiple_choice" | "numeric"; stem: string; explanation: string;
  choices: string[] | null; answer: string; correct_index: number | null;
}
export interface WorksheetSkill { id: string; code: string; name: string; section: number; nad: string; questions: WorksheetQuestion[] }

const letter = (i: number) => String.fromCharCode(65 + i);

export function WorksheetSheet({ title, subtitle, skills: numbered, withKey, withExplanations }: {
  title: string;
  subtitle: string;
  skills: (Omit<WorksheetSkill, "questions"> & { questions: (WorksheetQuestion & { n: number })[] })[];
  withKey: boolean;
  withExplanations: boolean;
}) {
  return (
    <main className="mx-auto max-w-3xl px-8 py-8 print:max-w-none print:p-0">
      <header className="mb-6 border-b-2 border-black pb-3">
        <div className="flex justify-between gap-6 text-sm">
          <span>Name: ______________________________</span>
          <span>Date: ______________</span>
          <span>Class: ________</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        <p className="mt-1 text-xs text-gray-600">Show your work in the space under each question. Write fractions in simplest form.</p>
      </header>

      {numbered.map((s) => (
        <section key={s.id} className="mb-6">
          <h2 className="mb-3 border-b border-gray-300 pb-1 text-base font-semibold">{s.code} {s.name}</h2>
          <ol className="space-y-5">
            {s.questions.map((q) => (
              <li key={q.id} className="break-inside-avoid">
                <div className="flex gap-2">
                  <span className="font-semibold">{q.n}.</span>
                  <div className="flex-1 space-y-2">
                    <p className="whitespace-pre-wrap">{q.stem}</p>
                    {q.choices ? (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        {q.choices.map((c, i) => (
                          <p key={i} className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black text-[10px]">{letter(i)}</span>
                            {c}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">Answer: ____________________</p>
                    )}
                    <div className="h-16" aria-hidden />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {withKey && (
        <section className="break-before-page pt-8 print:pt-0">
          <h2 className="mb-1 text-xl font-bold">Answer key: {title}</h2>
          <p className="mb-4 text-xs text-gray-600">For the teacher</p>
          <ol className="space-y-2 text-sm">
            {numbered.flatMap((s) => s.questions).map((q) => (
              <li key={q.id} className="break-inside-avoid">
                <span className="font-semibold">{q.n}. {q.correct_index !== null ? `${letter(q.correct_index)}) ` : ""}{q.answer}</span>
                {withExplanations && <span className="text-gray-700">: {q.explanation}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
