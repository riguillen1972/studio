"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Heart, Loader2, Pause, Play, Square, Volume2 } from "lucide-react";
import { useReadAloud } from "@/hooks/use-read-aloud";
import { useMentorChoice } from "@/hooks/use-mentor";
import { useAppState } from "@/components/app-state-provider";
import { questFetch } from "@/components/quest/quest-api";
import { QuickCheck } from "@/components/quest/lesson-view";
import { MentorPanel } from "./mentor-panel";
import { MentorPicker } from "./mentor-picker";
import type { MentorMood } from "@/components/mentor/mentor-avatar";
import type { LessonContent } from "@/lib/quest/lesson-types";
import { MENTORS_BY_ID } from "@/lib/mentors";

interface Page {
  id: string;
  /** What the voice reads and the mentor sees as "the page you're on". */
  text: string;
  /** What the mentor says on this page. */
  line: string;
  render: (ctx: PageContext) => React.ReactNode;
}
interface PageContext { shownSteps: number[]; showStep: (example: number, all?: boolean) => void; onCheck: (right: boolean) => void }

/** Splits a lesson into book pages. */
function pagesFor(l: LessonContent): Page[] {
  const pages: Page[] = [{
    id: "intro",
    text: `${l.title}. ${l.why} ${l.vocabulary.map((v) => `${v.term}: ${v.meaning}.`).join(" ")}`,
    line: `Welcome! Today we're learning ${l.title.toLowerCase()}. Let's start with why it matters.`,
    render: () => (
      <div className="space-y-5">
        <p className="text-lg leading-relaxed">{l.why}</p>
        {l.vocabulary.length > 0 && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-100/40 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">Words to know</p>
            <dl className="space-y-1.5">
              {l.vocabulary.map((v) => <div key={v.term}><dt className="inline font-semibold">{v.term}: </dt><dd className="inline">{v.meaning}</dd></div>)}
            </dl>
          </div>
        )}
      </div>
    ),
  }];

  // The big idea, two paragraphs to a page
  for (let i = 0; i < l.explain.length; i += 2) {
    const paras = l.explain.slice(i, i + 2);
    pages.push({
      id: `explain-${i}`,
      text: paras.join(" "),
      line: i === 0 ? "Here's the big idea. Let's read it together. Tap Read it to me if you'd like me to read." : "You're doing great. Here's the next part of the idea.",
      render: () => <div className="space-y-4 text-lg leading-relaxed">{paras.map((p, j) => <Markdown key={j}>{p}</Markdown>)}</div>,
    });
  }

  l.examples.forEach((e, i) => {
    pages.push({
      id: `example-${i}`,
      text: `Example ${i + 1}. ${e.problem} ${e.steps.map((s, j) => `Step ${j + 1}. ${s}`).join(" ")} Answer: ${e.answer}`,
      line: i === 0 ? "Let's work through an example together. Tap Next step when you're ready." : "This one is a little harder, which means your brain is growing. One step at a time.",
      render: ({ shownSteps, showStep }) => (
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Example {i + 1}</p>
          <p className="whitespace-pre-wrap text-lg font-medium">{e.problem}</p>
          <ol className="space-y-2">
            {e.steps.slice(0, shownSteps[i]).map((s, j) => (
              <motion.li key={j} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{j + 1}</span>
                <span className="pt-0.5"><Markdown>{s}</Markdown></span>
              </motion.li>
            ))}
          </ol>
          {shownSteps[i] < e.steps.length ? (
            <div className="flex gap-2">
              <Button onClick={() => showStep(i)}>Next step</Button>
              <Button variant="ghost" onClick={() => showStep(i, true)}>Show all steps</Button>
            </div>
          ) : (
            <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-green-500/10 p-3 font-medium text-green-800 dark:text-green-300">
              Answer: {e.answer}
            </motion.p>
          )}
        </div>
      ),
    });
  });

  pages.push({
    id: "watch",
    text: `Watch out. ${l.watch_out} ${l.faith ?? ""}`,
    line: "Here's a mistake lots of students make. Knowing it helps you catch it.",
    render: () => (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-lg"><p className="font-bold">Watch out</p><Markdown>{l.watch_out}</Markdown></div>
        </div>
        {l.faith && (
          <div className="flex gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
            <Heart className="mt-1 h-5 w-5 shrink-0 text-sky-600" />
            <p className="text-lg italic">{l.faith}</p>
          </div>
        )}
      </div>
    ),
  });

  pages.push({
    id: "check",
    text: `Your turn. ${l.check.question}`,
    line: "Your turn! Give it your best try. If you get stuck, ask me for a hint.",
    render: ({ onCheck }) => <div className="text-lg"><QuickCheck check={l.check} onResult={onCheck} /></div>,
  });
  return pages;
}

/**
 * A textbook lesson as a book: pages to turn, read-aloud, and (in personal mentor mode) the
 * student's mentor beside it. Writes the lesson first if it doesn't exist yet.
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
  preloaded?: LessonContent;
}) {
  const { teachingMode, role } = useAppState();
  const { mentorId, setMentorId, loaded } = useMentorChoice();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [status, setStatus] = useState<"loading" | "writing" | "ready" | "missing" | "error">("loading");
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [shownSteps, setShownSteps] = useState<number[]>([]);
  const [mood, setMood] = useState<MentorMood | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const voice = useReadAloud();
  const { stop } = voice;

  // Teachers preview the book with the mentor; students see it unless their teacher teaches the lesson
  const showMentor = role === "teacher" || teachingMode === "mentor";

  const load = useCallback(async () => {
    if (preloaded) { setLesson(preloaded); setStatus("ready"); return; }
    setStatus("loading");
    try {
      const r = await questFetch<{ lesson: LessonContent | null; missing: boolean }>(`/api/quest/lessons/${encodeURIComponent(skillId)}`);
      if (r.lesson) { setLesson(r.lesson); setStatus("ready"); return; }
      if (!r.missing) { setStatus("missing"); return; }
      setStatus("writing");
      const w = await questFetch<{ lesson: LessonContent }>(`/api/quest/lessons/${encodeURIComponent(skillId)}`, { method: "POST", body: "{}" });
      setLesson(w.lesson);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [skillId, preloaded]);

  useEffect(() => { load(); setPage(0); return () => stop(); }, [load, stop]);
  useEffect(() => { if (lesson) setShownSteps(lesson.examples.map(() => 1)); }, [lesson]);
  // First visit: choose a mentor
  useEffect(() => { if (loaded && !mentorId && showMentor && status === "ready") setPickerOpen(true); }, [loaded, mentorId, showMentor, status]);

  const pages = useMemo(() => (lesson ? pagesFor(lesson) : []), [lesson]);
  const current = pages[page];

  // New page: the mentor's line for it, and stop reading the old page
  useEffect(() => { setLine(null); setMood(null); stop(); }, [page, stop]);
  useEffect(() => { if (voice.speaking) setMood("talking"); else setMood((m) => (m === "talking" ? null : m)); }, [voice.speaking]);

  const go = (to: number) => {
    if (to < 0 || to >= pages.length) return;
    setDirection(to > page ? 1 : -1);
    setPage(to);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const ctx: PageContext = {
    shownSteps,
    showStep: (i, all) => setShownSteps((s) => s.map((n, k) => (k === i ? (all ? lesson!.examples[i].steps.length : n + 1) : n))),
    // Growth-mindset feedback: praise the strategy, and treat a mistake as "not yet"
    onCheck: (right) => {
      setMood(right ? "cheering" : "encouraging");
      setLine(right
        ? "Yes! You used the same steps as the examples, and that's exactly how mathematicians work. Ready to practice?"
        : "Not yet, and that's okay. Mistakes are how your brain learns. Look back at the examples, or ask me for a hint.");
    },
  };

  if (status === "loading") return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (status === "writing") {
    return <div className="space-y-3 py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /><p className="text-muted-foreground">Writing this lesson and checking its math. This takes about half a minute, only the first time.</p></div>;
  }
  if (status !== "ready" || !current) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="text-muted-foreground">{status === "missing" ? "Your teacher has hidden this lesson for now." : "This lesson couldn't be loaded. Please try again."}</p>
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

      {teachingMode !== "mentor" && role !== "teacher" && (
        <p className="rounded-lg border bg-muted/40 p-3 text-sm">
          {teachingMode === "teacher"
            ? "Your teacher is teaching this lesson in class. You can read the textbook here anytime."
            : "Your class will learn this lesson with the AI Teacher. You can read ahead here."}
        </p>
      )}

      <div className={`grid gap-4 ${showMentor && mentorId ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
        {/* The page */}
        <div className="relative overflow-hidden rounded-2xl border-2 bg-[#FFFDF7] text-gray-900 shadow-md dark:bg-zinc-900 dark:text-zinc-100">
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent" aria-hidden />
          <div className="min-h-[360px] px-5 py-6 pl-7 sm:px-10">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40, rotateY: direction * 8 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: direction * -40, rotateY: direction * -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {current.render(ctx)}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-black/5 px-3 py-3 sm:px-6 dark:border-white/10">
            <Button variant="ghost" onClick={() => go(page - 1)} disabled={page === 0}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
            <span className="text-sm tabular-nums text-muted-foreground sm:hidden">{page + 1} / {pages.length}</span>
            <div className="hidden items-center gap-1.5 sm:flex" aria-label={`Page ${page + 1} of ${pages.length}`}>
              {pages.map((p, i) => (
                <button key={p.id} type="button" onClick={() => go(i)} aria-label={`Page ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${i === page ? "w-6 bg-primary" : "w-2.5 bg-black/20 dark:bg-white/25"}`} />
              ))}
            </div>
            {!isLast ? (
              <Button onClick={() => go(page + 1)}>Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            ) : canPractice ? (
              <Button asChild><Link href={`/quest?skill=${encodeURIComponent(skillId)}`}>Practice <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
            ) : <span />}
          </div>
        </div>

        {showMentor && mentorId && (
          <MentorPanel mentorId={mentorId} skillId={skillId} line={mentorLine} pageText={current.text} mood={mood}
            onChangeMentor={() => setPickerOpen(true)} />
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
            <DialogDescription>Your mentor reads with you, explains each page, and answers your questions. You can change anytime.</DialogDescription>
          </DialogHeader>
          <MentorPicker current={mentorId} onPick={(id) => { setMentorId(id); setPickerOpen(false); setLine(`Hello, I'm ${MENTORS_BY_ID[id].name}. I'm glad to learn with you!`); setMood("cheering"); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
