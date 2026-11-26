"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, BookOpen, Heart, HelpCircle, Loader2, Pause, Play, Search, Square, Star, Target, Volume2 } from "lucide-react";
import { useReadAloud } from "@/hooks/use-read-aloud";
import { useMentorChoice } from "@/hooks/use-mentor";
import { useAppState } from "@/components/app-state-provider";
import { questFetch } from "@/components/quest/quest-api";
import { MentorPanel } from "./mentor-panel";
import { MentorPicker } from "./mentor-picker";
import { BookProblemCard, type ProblemEvent } from "./book-problem";
import type { MentorMood } from "@/components/mentor/mentor-avatar";
import type { LessonContent } from "@/lib/quest/lesson-types";
import { fromShortLesson, WORKSHEET_LEVELS, type BookPart, type BookProblem, type TextbookLesson } from "@/lib/textbook-lesson";
import { MENTORS_BY_ID } from "@/lib/mentors";
import { gradesWorksheet } from "@/lib/textbook-grade";
import type { TextbookResult } from "@/components/app-state-provider";

interface PageContext {
  shownSteps: Record<number, number>;
  showStep: (part: number, all?: boolean) => void;
  /** A Try It, warm-up or worksheet problem was checked. */
  onProblem: (e: ProblemEvent, key: string) => void;
  /** Ask the mentor for help with a problem. */
  askMentor: ((p: BookProblem, label: string, response: string | null) => void) | null;
  mentorName?: string;
  /** Teacher preview: answer keys instead of answer boxes. */
  answerKey: boolean;
  worksheetScore: { right: number; done: number };
}

interface Page {
  id: string;
  /** Section name shown above the page. */
  section: string;
  /** What the voice reads and the mentor sees as "the page you're on". */
  text: string;
  /** What the mentor says on this page. */
  line: string;
  render: (ctx: PageContext) => React.ReactNode;
}

const problemText = (p: BookProblem) => p.question + (p.choices ? ` Choices: ${p.choices.join(", ")}.` : "");

function PartRead({ part }: { part: BookPart }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-headline">{part.heading}</h2>
      <div className="space-y-3 text-lg leading-relaxed">{part.read.map((p, i) => <Markdown key={i}>{p}</Markdown>)}</div>
      {part.model && (
        <figure className="overflow-x-auto rounded-xl border border-sky-500/30 bg-sky-500/5 p-3">
          <figcaption className="mb-2 text-sm font-semibold text-sky-800 dark:text-sky-300">{part.model.caption}</figcaption>
          <table className="w-full border-collapse text-sm">
            <thead><tr>{part.model.rows[0].map((c, i) => <th key={i} className="border-b border-sky-500/30 px-2 py-1.5 text-left font-semibold">{c}</th>)}</tr></thead>
            <tbody>{part.model.rows.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-black/5 px-2 py-1.5 dark:border-white/10">{c}</td>)}</tr>)}</tbody>
          </table>
        </figure>
      )}
    </div>
  );
}

function PartExample({ part, index, shown, showStep }: { part: BookPart; index: number; shown: number; showStep: (part: number, all?: boolean) => void }) {
  const [whyOpen, setWhyOpen] = useState<Set<number>>(new Set());
  const e = part.example;
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold uppercase tracking-wide text-primary">Worked example</p>
      <p className="whitespace-pre-wrap text-lg font-medium">{e.problem}</p>
      <ol className="space-y-2">
        {e.steps.slice(0, shown).map((s, j) => (
          <motion.li key={j} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{j + 1}</span>
            <div className="pt-0.5">
              <Markdown>{s.say}</Markdown>
              {s.why && (whyOpen.has(j)
                ? <p className="mt-1 text-sm italic text-muted-foreground">Why? {s.why}</p>
                : <button type="button" className="mt-0.5 text-sm text-primary hover:underline" onClick={() => setWhyOpen((w) => new Set(w).add(j))}>Why?</button>)}
            </div>
          </motion.li>
        ))}
      </ol>
      {shown < e.steps.length ? (
        <div className="flex gap-2">
          <Button onClick={() => showStep(index)}>Next step</Button>
          <Button variant="ghost" onClick={() => showStep(index, true)}>Show all steps</Button>
        </div>
      ) : (
        <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-green-500/10 p-3 font-medium text-green-800 dark:text-green-300">
          {e.answer}
        </motion.p>
      )}
    </div>
  );
}

function MistakePage({ mistake: m }: { mistake: TextbookLesson["mistake"] }) {
  const [shown, setShown] = useState(!m.problem);
  return (
    <div className="space-y-4">
      {m.problem && (
        <>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300"><Search className="h-4 w-4" /> Spot the mistake</p>
          <p className="text-lg font-medium">{m.problem}</p>
          <ol className="space-y-1 rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-[15px]">
            {m.work.map((w, i) => <li key={i}>{w}</li>)}
          </ol>
        </>
      )}
      {shown ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 text-lg">
          <p><b>{m.problem ? "What went wrong: " : "Watch out: "}</b>{m.what_went_wrong}</p>
          {m.fix && <p><b>The fix: </b>{m.fix}</p>}
        </motion.div>
      ) : (
        <Button variant="outline" onClick={() => setShown(true)}><HelpCircle className="mr-1.5 h-4 w-4" /> I think I found it. Show me.</Button>
      )}
    </div>
  );
}

/** Splits a lesson into book pages: start, warm-up, each part (read, example, Try It), mistake, wrap-up, worksheet. */
function pagesFor(l: TextbookLesson): Page[] {
  const pages: Page[] = [{
    id: "start", section: "Let's start",
    text: `${l.title}. ${l.hook} ${l.goal} ${l.vocabulary.map((v) => `${v.term}: ${v.meaning}.`).join(" ")}`,
    line: `Welcome! Today's lesson is ${l.title}. We'll take it one small step at a time, together.`,
    render: () => (
      <div className="space-y-5">
        <p className="text-lg leading-relaxed">{l.hook}</p>
        <p className="flex gap-2 rounded-xl bg-primary/10 p-3 font-semibold"><Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {l.goal}</p>
        {l.vocabulary.length > 0 && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-100/40 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">Words to know</p>
            <dl className="space-y-2">
              {l.vocabulary.map((v) => (
                <div key={v.term}>
                  <dt className="inline font-semibold">{v.term}: </dt><dd className="inline">{v.meaning}</dd>
                  {v.example && <p className="text-sm text-muted-foreground">{v.example}</p>}
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    ),
  }];

  if (l.warm_up.length) {
    pages.push({
      id: "warm-up", section: "Warm-up",
      text: `Warm-up. ${l.warm_up.map(problemText).join(" ")}`,
      line: "Let's wake up your brain with a couple of quick ones you already know.",
      render: (ctx) => (
        <div className="space-y-4">
          <p className="text-lg">Two quick questions from earlier lessons to get your brain ready.</p>
          {l.warm_up.map((p, i) => (
            <BookProblemCard key={i} problem={p} label={`Warm-up ${i + 1}`} mentorName={ctx.mentorName} answerKey={ctx.answerKey}
              onResult={(e) => ctx.onProblem(e, `warm-${i}`)} />
          ))}
        </div>
      ),
    });
  }

  l.parts.forEach((part, i) => {
    const n = i + 1;
    const section = `Part ${n} of ${l.parts.length}: ${part.heading}`;
    if (part.read.length || part.model) {
      pages.push({
        id: `read-${i}`, section,
        text: `${part.heading}. ${part.read.join(" ")}${part.model ? ` ${part.model.caption}: ${part.model.rows.map((r) => r.join(", ")).join(". ")}.` : ""}`,
        line: part.mentor,
        render: () => <PartRead part={part} />,
      });
    }
    pages.push({
      id: `example-${i}`, section,
      text: `Worked example. ${part.example.problem} ${part.example.steps.map((s, j) => `Step ${j + 1}. ${s.say}`).join(" ")} ${part.example.answer}`,
      line: i === 0 ? "Let's work through this together. Tap Next step when you're ready, and tap Why? if a step surprises you." : "Same idea, one step further. Take your time with each step.",
      render: (ctx) => <PartExample part={part} index={i} shown={ctx.shownSteps[i] ?? 1} showStep={ctx.showStep} />,
    });
    if (part.try_it.length) {
      pages.push({
        id: `try-${i}`, section,
        text: `Try it. ${part.try_it.map(problemText).join(" ")}`,
        line: "Your turn! Give it a try. I'll tell you how it went, and if it's not right yet, we'll fix it together.",
        render: (ctx) => (
          <div className="space-y-4">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Try it</p>
            {part.try_it.map((p, j) => (
              <BookProblemCard key={j} problem={p} label={part.try_it.length > 1 ? `Try it ${n}.${j + 1}` : undefined} mentorName={ctx.mentorName} answerKey={ctx.answerKey}
                onResult={(e) => ctx.onProblem(e, `try-${i}-${j}`)} />
            ))}
          </div>
        ),
      });
    }
  });

  if (l.mistake.what_went_wrong) {
    const m = l.mistake;
    pages.push({
      id: "mistake", section: m.problem ? "Spot the mistake" : "Watch out",
      text: m.problem ? `Spot the mistake. ${m.problem} ${m.work.join(" ")}` : `Watch out. ${m.what_went_wrong}`,
      line: m.problem ? "Everyone makes mistakes, even mathematicians. Can you find this one before you tap to see it?" : "Here's a mistake lots of students make. Knowing it helps you catch it.",
      render: () => <MistakePage mistake={m} />,
    });
  }

  if (l.summary.length || l.faith) {
    pages.push({
      id: "wrap", section: "Wrap-up",
      text: `Remember. ${l.summary.join(" ")} ${l.faith ?? ""}`,
      line: "Look how much you learned! These are the big ideas to remember.",
      render: () => (
        <div className="space-y-4">
          {l.summary.length > 0 && (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <p className="mb-2 font-bold">Remember</p>
              <ul className="space-y-2 text-lg">{l.summary.map((s, i) => <li key={i} className="flex gap-2"><Star className="mt-1 h-4 w-4 shrink-0 text-primary" /> <Markdown>{s}</Markdown></li>)}</ul>
            </div>
          )}
          {l.faith && (
            <div className="flex gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
              <Heart className="mt-1 h-5 w-5 shrink-0 text-sky-600" />
              <p className="text-lg italic">{l.faith}</p>
            </div>
          )}
          {l.worksheet.length > 0 && <p className="text-muted-foreground">Next up: the worksheet, where you'll show what you know.</p>}
        </div>
      ),
    });
  }

  if (l.worksheet.length) {
    pages.push({
      id: "worksheet", section: "Worksheet",
      text: `Worksheet. ${l.worksheet.map((p, i) => `${i + 1}. ${problemText(p)}`).join(" ")}`,
      line: "Now show what you know! Work at your own pace. If you get stuck, tap Hint, or ask me and I'll help you think it through.",
      render: (ctx) => (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base">Show what you know. Tap Hint or ask for help anytime.</p>
            {!ctx.answerKey && <p className="text-sm tabular-nums text-muted-foreground">{ctx.worksheetScore.done} of {l.worksheet.length} done · {ctx.worksheetScore.right} right</p>}
          </div>
          {l.worksheet.map((p, i) => (
            <BookProblemCard key={i} problem={p} label={`${i + 1} · ${WORKSHEET_LEVELS[p.level]}`} mentorName={ctx.mentorName} answerKey={ctx.answerKey}
              onResult={(e) => ctx.onProblem(e, `ws-${i}`)}
              onAskMentor={ctx.askMentor ? (r) => ctx.askMentor!(p, `worksheet problem ${i + 1}`, r) : undefined} />
          ))}
          {ctx.worksheetScore.done === l.worksheet.length && (
            <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-green-500/10 p-4 text-center text-lg font-semibold text-green-800 dark:text-green-300">
              Worksheet finished: {ctx.worksheetScore.right} of {l.worksheet.length} right. Great work sticking with it!
            </motion.p>
          )}
        </div>
      ),
    });
  }
  return pages;
}

/**
 * A textbook lesson as a book: read with the mentor, try each step with the mentor's feedback,
 * then a worksheet where the mentor helps when asked. Writes a short lesson first if the skill has
 * no pre-written one yet.
 */
export function BookReader({ skillId, skillName, chapterLabel, lessonLabel, nextLesson, prevLesson, canPractice, preloaded }: {
  skillId: string;
  skillName: string;
  chapterLabel: string;
  lessonLabel: string;
  nextLesson?: { id: string; label: string } | null;
  prevLesson?: { id: string; label: string } | null;
  canPractice: boolean;
  /** A lesson that's already loaded (skips fetching it). */
  preloaded?: TextbookLesson;
}) {
  const { teachingMode, role, recordTextbookResult } = useAppState();
  const { mentorId, setMentorId, loaded } = useMentorChoice();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lesson, setLesson] = useState<TextbookLesson | null>(null);
  const [status, setStatus] = useState<"loading" | "writing" | "ready" | "missing" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [shownSteps, setShownSteps] = useState<Record<number, number>>({});
  const [mood, setMood] = useState<MentorMood | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ProblemEvent>>({});
  // Every answer tried, per problem, for grading
  const [tries, setTries] = useState<Record<string, string[]>>({});
  const [grade, setGrade] = useState<{ status: "saving" | "saved" | "error"; result?: TextbookResult & { points: number; total: number }; error?: string } | null>(null);
  const [request, setRequest] = useState<{ id: number; text: string; pageText: string } | null>(null);
  const requestId = useRef(0);
  const voice = useReadAloud();
  const { stop } = voice;

  // Teachers assign lessons rather than do them, so they see a preview with answer keys and no
  // mentor. Students have their mentor unless their teacher teaches the lesson.
  const isTeacher = role === "teacher";
  const showMentor = !isTeacher && teachingMode === "mentor";
  const mentor = showMentor && mentorId ? MENTORS_BY_ID[mentorId] : null;

  const load = useCallback(async () => {
    if (preloaded) { setLesson(preloaded); setStatus("ready"); return; }
    setStatus("loading");
    try {
      type Got = { lesson: LessonContent | null; book?: TextbookLesson | null; missing: boolean };
      const r = await questFetch<Got>(`/api/quest/lessons/${encodeURIComponent(skillId)}`);
      if (r.book) { setLesson(r.book); setStatus("ready"); return; }
      if (r.lesson) { setLesson(fromShortLesson(skillId, r.lesson)); setStatus("ready"); return; }
      if (!r.missing) { setStatus("missing"); return; }
      setStatus("writing");
      const w = await questFetch<{ lesson: LessonContent }>(`/api/quest/lessons/${encodeURIComponent(skillId)}`, { method: "POST", body: "{}" });
      setLesson(fromShortLesson(skillId, w.lesson));
      setStatus("ready");
    } catch (e) {
      setLoadError(e instanceof Error && /accuracy/i.test(e.message)
        ? "This lesson didn't pass our accuracy check yet, so we didn't show it. Tap Try again and we'll write a fresh one."
        : "This lesson couldn't be loaded. Please check your connection and try again.");
      setStatus("error");
    }
  }, [skillId, preloaded]);

  useEffect(() => { load(); setPage(0); setResults({}); setTries({}); setGrade(null); setShownSteps({}); return () => stop(); }, [load, stop]);
  // First visit: choose a mentor
  useEffect(() => { if (loaded && !mentorId && showMentor && status === "ready") setPickerOpen(true); }, [loaded, mentorId, showMentor, status]);

  const pages = useMemo(() => (lesson ? pagesFor(lesson) : []), [lesson]);
  const current = pages[page];

  // New page: the mentor's line for it, and stop reading the old page
  useEffect(() => { setLine(null); setMood(null); stop(); }, [page, stop]);
  useEffect(() => { if (voice.speaking) setMood("talking"); else setMood((m) => (m === "talking" ? null : m)); }, [voice.speaking]);

  const go = (to: number) => {
    if (to < 0 || to >= pages.length) return;
    setPage(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, button")) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const worksheetScore = useMemo(() => {
    const ws = Object.entries(results).filter(([k, r]) => k.startsWith("ws-") && r.done);
    return { done: ws.length, right: ws.filter(([, r]) => r.right).length };
  }, [results]);

  // Remember the worksheet score on this device
  useEffect(() => {
    if (!lesson?.worksheet.length || !worksheetScore.done) return;
    try { localStorage.setItem(`studybuddy.worksheet.${skillId}`, JSON.stringify({ ...worksheetScore, total: lesson.worksheet.length })); } catch { /* storage unavailable */ }
  }, [worksheetScore, lesson, skillId]);

  // The problems the lesson is graded on: the worksheet, or the Try Its when there's no worksheet
  const gradedKeys = useMemo(() => {
    if (!lesson) return [];
    return gradesWorksheet(lesson)
      ? lesson.worksheet.map((_, i) => `ws-${i}`)
      : lesson.parts.flatMap((p, i) => p.try_it.map((_, j) => `try-${i}-${j}`));
  }, [lesson]);
  const allDone = gradedKeys.length > 0 && gradedKeys.every((k) => results[k]?.done);

  // When a student finishes every graded problem, the server grades the answers and saves the grade
  const submit = useCallback(async () => {
    setGrade({ status: "saving" });
    try {
      const r = await questFetch<{ result: TextbookResult & { points: number; total: number } }>("/api/textbook/results", {
        method: "POST",
        body: JSON.stringify({ skill_id: skillId, responses: gradedKeys.map((k) => tries[k] ?? []) }),
      });
      setGrade({ status: "saved", result: r.result });
      recordTextbookResult(r.result);
      setMood("cheering");
      setLine(r.result.score >= 80
        ? `You finished the lesson with ${r.result.score}%! Your hard work really shows.`
        : `You finished the lesson with ${r.result.score}%. Every problem you worked through made your brain stronger. You can try the lesson again anytime.`);
    } catch (e) {
      setGrade({ status: "error", error: e instanceof Error ? e.message : "Couldn't save your grade." });
    }
  }, [skillId, gradedKeys, tries, recordTextbookResult]);
  useEffect(() => {
    if (allDone && !grade && role === "k12" && !preloaded) submit();
  }, [allDone, grade, role, preloaded, submit]);

  const ctx: PageContext = {
    shownSteps,
    showStep: (i, all) => setShownSteps((s) => ({ ...s, [i]: all ? lesson!.parts[i].example.steps.length : (s[i] ?? 1) + 1 })),
    // Growth-mindset feedback: praise the strategy, and treat a mistake as "not yet"
    onProblem: (e, key) => {
      setResults((r) => ({ ...r, [key]: e }));
      setTries((t) => ({ ...t, [key]: [...(t[key] ?? []), e.response] }));
      setMood(e.right ? "cheering" : "encouraging");
      setLine(e.right
        ? e.tries === 1 ? "Yes! You followed the steps just like the example. That's exactly how mathematicians work." : "You stuck with it and figured it out. That kind of effort is what makes your brain stronger!"
        : e.message);
    },
    askMentor: mentor
      ? (p, label, response) => {
          requestId.current += 1;
          setRequest({
            id: requestId.current,
            text: `Can you help me with ${label}? ${response ? `I answered ${response}, but I'm not sure.` : "I'm not sure how to start."} Please don't tell me the answer, just help me think.`,
            pageText: `${label}: ${problemText(p)}`,
          });
        }
      : null,
    mentorName: mentor?.name,
    answerKey: isTeacher,
    worksheetScore,
  };

  if (status === "loading") return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (status === "writing") {
    return <div className="space-y-3 py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /><p className="text-muted-foreground">Getting this lesson ready and checking its math. This takes about a minute, only the first time.</p></div>;
  }
  if (status !== "ready" || !current) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="text-muted-foreground">{status === "missing" ? "Your teacher has hidden this lesson for now." : loadError}</p>
        {status === "error" && <Button variant="outline" onClick={load}>Try again</Button>}
      </div>
    );
  }

  const isLast = page === pages.length - 1;
  const mentorLine = line ?? current.line;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{chapterLabel}</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold font-headline"><BookOpen className="h-6 w-6 text-primary" /> {lessonLabel} {lesson!.title || skillName}</h1>
        </div>
        {voice.supported && (
          <div className="flex items-center gap-2">
            {voice.speaking
              ? <Button size="sm" variant="outline" onClick={voice.pause}><Pause className="mr-1.5 h-4 w-4" /> Pause</Button>
              : voice.paused
                ? <Button size="sm" variant="outline" onClick={voice.resume}><Play className="mr-1.5 h-4 w-4" /> Resume</Button>
                : <Button size="sm" variant="outline" onClick={() => voice.play([current.text], 0, mentorId ? MENTORS_BY_ID[mentorId].voiceHint : undefined)}><Volume2 className="mr-1.5 h-4 w-4" /> Read it to me</Button>}
            {(voice.speaking || voice.paused) && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={voice.stop} aria-label="Stop reading"><Square className="h-3.5 w-3.5" /></Button>}
          </div>
        )}
      </div>

      {isTeacher && (
        <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <b>Teacher preview.</b> This is what your students see. They read it with their mentor, answer each Try It and do the worksheet; you see the answer keys.{" "}
          <Link href="/textbook" className="font-medium text-primary hover:underline">Assign lessons from the table of contents</Link>
        </p>
      )}

      {teachingMode !== "mentor" && !isTeacher && (
        <p className="rounded-lg border bg-muted/40 p-3 text-sm">
          {teachingMode === "teacher"
            ? "Your teacher is teaching this lesson in class. You can read the textbook here anytime."
            : "Your class will learn this lesson with the AI Teacher. You can read ahead here."}
        </p>
      )}

      {grade && (
        <div role="status" className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 p-3 ${grade.status === "error" ? "border-destructive/40 bg-destructive/5" : "border-green-500/40 bg-green-500/10"}`}>
          {grade.status === "saving" && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Grading your lesson…</p>}
          {grade.status === "saved" && grade.result && (
            <p className="text-sm sm:text-base">
              <b className="text-lg">Lesson complete: {grade.result.score}%</b>
              <span className="text-muted-foreground"> · {grade.result.points} of {grade.result.total} points · saved for your teacher</span>
            </p>
          )}
          {grade.status === "error" && (
            <>
              <p className="text-sm text-destructive">{grade.error}</p>
              <Button size="sm" variant="outline" onClick={submit}>Try again</Button>
            </>
          )}
        </div>
      )}

      <div className={`grid gap-4 ${mentor ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
        {/* The pages: all stay mounted so answers aren't lost when the student turns back */}
        <div className="relative overflow-hidden rounded-2xl border-2 bg-[#FFFDF7] text-gray-900 shadow-md dark:bg-zinc-900 dark:text-zinc-100">
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent" aria-hidden />
          <p className="px-5 pt-4 pl-7 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-10">{current.section}</p>
          <div className="min-h-[360px] px-5 pb-6 pt-2 pl-7 sm:px-10">
            {pages.map((p, i) => (
              <div key={p.id} hidden={i !== page} className={i === page ? "duration-200 animate-in fade-in slide-in-from-right-4" : undefined}>
                {p.render(ctx)}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-black/5 px-3 py-3 sm:px-6 dark:border-white/10">
            <Button variant="ghost" onClick={() => go(page - 1)} disabled={page === 0}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
            <span className="text-sm tabular-nums text-muted-foreground sm:hidden">{page + 1} / {pages.length}</span>
            <div className="hidden items-center gap-1.5 sm:flex" aria-label={`Page ${page + 1} of ${pages.length}`}>
              {pages.map((p, i) => (
                <button key={p.id} type="button" onClick={() => go(i)} aria-label={`Page ${i + 1}: ${p.section}`} title={p.section}
                  className={`h-2.5 rounded-full transition-all ${i === page ? "w-6 bg-primary" : "w-2.5 bg-black/20 dark:bg-white/25"}`} />
              ))}
            </div>
            {!isLast ? (
              <Button onClick={() => go(page + 1)}>Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            ) : canPractice ? (
              <Button asChild><Link href={`/quest?skill=${encodeURIComponent(skillId)}`}>Practice more <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
            ) : <span />}
          </div>
        </div>

        {mentor && mentorId && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <MentorPanel mentorId={mentorId} skillId={skillId} line={mentorLine} pageText={current.text} mood={mood}
              request={request} onChangeMentor={() => setPickerOpen(true)} />
          </div>
        )}
      </div>

      <div className="flex justify-between text-sm">
        {prevLesson ? <Link className="text-muted-foreground hover:text-primary" href={`/textbook/${prevLesson.id}`}>← {prevLesson.label}</Link> : <span />}
        <Link className="text-muted-foreground hover:text-primary" href="/textbook">Table of contents</Link>
        {nextLesson ? <Link className="text-muted-foreground hover:text-primary" href={`/textbook/${nextLesson.id}`}>{nextLesson.label} →</Link> : <span />}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose your mentor</DialogTitle>
            <DialogDescription>Your mentor reads with you, checks your Try Its, and helps with the worksheet. You can change anytime.</DialogDescription>
          </DialogHeader>
          <MentorPicker current={mentorId} onPick={(id) => { setMentorId(id); setPickerOpen(false); setLine(`Hello, I'm ${MENTORS_BY_ID[id].name}. I'm glad to learn with you!`); setMood("cheering"); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
