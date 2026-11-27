"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, NotebookPen, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppState } from "@/components/app-state-provider";
import { questFetch } from "@/components/quest/quest-api";
import { SKILLS_BY_ID } from "@/lib/quest/skills";
import type { LessonContent } from "@/lib/quest/lesson-types";
import { buildTeacherGuide } from "@/lib/teacher-guide";
import { lessonPlace } from "@/lib/textbook";
import { fromShortLesson, type TextbookLesson } from "@/lib/textbook-lesson";

type LoadStatus = "loading" | "ready" | "missing" | "error";

/** Printable Teacher Guide for a single Math Textbook lesson. */
export default function TeacherGuidePage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: skillId } = use(params);
  const { role } = useAppState();
  const skill = SKILLS_BY_ID[skillId];
  // Computed once per lesson: lessonPlace returns a new object each call, and a new object in
  // load's dependencies would reload the lesson on every render (the guide flickered nonstop)
  const place = useMemo(() => lessonPlace(skillId), [skillId]);
  const isBlocked = Boolean(role && role !== "teacher");

  const [lesson, setLesson] = useState<TextbookLesson | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const wasOpenRef = useRef<boolean | null>(null);

  const load = useCallback(async () => {
    if (!skill || !place || isBlocked) return;
    setStatus("loading");
    setLoadError(null);
    try {
      type Got = { lesson: LessonContent | null; book?: TextbookLesson | null; missing: boolean };
      const r = await questFetch<Got>(`/api/quest/lessons/${encodeURIComponent(skillId)}`);
      if (r.book) { setLesson(r.book); setStatus("ready"); return; }
      if (r.lesson) { setLesson(fromShortLesson(skillId, r.lesson)); setStatus("ready"); return; }
      setStatus("missing");
    } catch {
      setLoadError("This teacher guide couldn't be loaded. Please check your connection and try again.");
      setStatus("error");
    }
  }, [skillId, skill, place, isBlocked]);

  useEffect(() => {
    load();
  }, [load]);

  // Ensure the Answer Key <details> opens automatically during browser print and restores afterward.
  useEffect(() => {
    const onBeforePrint = () => {
      const el = detailsRef.current;
      if (!el) return;
      wasOpenRef.current = el.open;
      el.open = true;
    };
    const onAfterPrint = () => {
      const el = detailsRef.current;
      if (!el || wasOpenRef.current === null) return;
      el.open = wasOpenRef.current;
      wasOpenRef.current = null;
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  const guide = useMemo(() => (lesson ? buildTeacherGuide(lesson) : null), [lesson]);

  if (!skill || !place) {
    return (
      <p className="text-muted-foreground">
        That lesson wasn&apos;t found.{" "}
        <Link className="text-primary hover:underline" href="/textbook">Back to the textbook</Link>
      </p>
    );
  }

  if (isBlocked) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-12">
        <p className="text-muted-foreground">The teacher guide is for teachers.</p>
        <Button asChild variant="outline">
          <Link href={`/textbook/${skillId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to lesson
          </Link>
        </Button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="mx-auto max-w-4xl space-y-3 py-16 text-center">
        <p className="text-muted-foreground">This lesson hasn&apos;t been written yet.</p>
        <Button asChild variant="outline">
          <Link href={`/textbook/${skillId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to lesson
          </Link>
        </Button>
      </div>
    );
  }

  if (status === "error" || !guide) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 py-16 text-center">
        <p className="text-muted-foreground">{loadError ?? "This teacher guide couldn't be loaded."}</p>
        <Button variant="outline" onClick={load}>Try again</Button>
      </div>
    );
  }

  const handlePrint = () => {
    if (detailsRef.current) {
      wasOpenRef.current = detailsRef.current.open;
      detailsRef.current.open = true;
    }
    window.print();
  };

  const gradeValue = guide.grade ?? place.grade;

  return (
    <div className="mx-auto max-w-4xl space-y-8 print:max-w-none print:bg-white print:text-black">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5 print:border-black/20">
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary print:text-black">
            <NotebookPen className="h-4 w-4" /> Teacher Guide
          </p>
          <h1 className="text-2xl font-bold font-headline tracking-tight sm:text-3xl">
            Lesson {place.chapter.number}.{place.lessonInChapter} {guide.title}
          </h1>
          <p className="text-sm text-muted-foreground print:text-black">
            Grade {gradeValue}
            {guide.standards ? ` · ${guide.standards}` : ""}
          </p>
          <p className="pt-1 text-base font-medium">{guide.goal}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button asChild variant="outline">
            <Link href={`/textbook/${skillId}`}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to lesson
            </Link>
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold font-headline">Overview</h2>
        <Card className="break-inside-avoid print:border-black/20 print:bg-white print:text-black print:shadow-none">
          <CardContent className="space-y-4 pt-6 text-sm leading-relaxed">
            <div>
              <p className="font-semibold">Opening situation</p>
              <p>{guide.overview}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium">About {guide.totalMinutes} minutes</p>
              {guide.twoDays && (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-medium text-amber-900 dark:text-amber-200 print:border-black/30 print:bg-transparent print:text-black">
                  Consider teaching this over two class periods.
                </p>
              )}
            </div>

            {guide.vocabulary.length > 0 && (
              <div>
                <p className="mb-1.5 font-semibold">Vocabulary</p>
                <ul className="space-y-1">
                  {guide.vocabulary.map((v) => (
                    <li key={v.term}>
                      <span className="font-semibold">{v.term}:</span> {v.meaning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {guide.prerequisites.length > 0 && (
              <div>
                <p className="mb-1 font-semibold">Prerequisites</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {guide.prerequisites.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold font-headline">Lesson plan</h2>
        <div className="space-y-4">
          {guide.plan.map((section, idx) => (
            <Card key={`${idx}-${section.title}`} className="break-inside-avoid print:border-black/20 print:bg-white print:text-black print:shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-lg">
                  {idx + 1}. {section.title}
                </CardTitle>
                <Badge variant="secondary" className="shrink-0 print:border print:border-black/30 print:bg-transparent print:text-black">
                  {section.minutes} min
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-1.5 pl-5">
                  {section.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>

                {section.problems.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-semibold">Class problems</p>
                    <ul className="space-y-1 pl-4">
                      {section.problems.map((p) => (
                        <li key={p.label}>
                          <span className="font-semibold">{p.label}:</span> {p.question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.ask.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-semibold">Ask the class</p>
                    <ul className="space-y-2 pl-4">
                      {section.ask.map((item, i) => (
                        <li key={i}>
                          <span>{item.q}</span>{" "}
                          <span className="text-muted-foreground print:text-neutral-700">{item.a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold font-headline">Mistakes to watch for</h2>
        <Card className="break-inside-avoid print:border-black/20 print:bg-white print:text-black print:shadow-none">
          <CardContent className="pt-6">
            {guide.misconceptions.length === 0 ? (
              <p className="text-sm text-muted-foreground print:text-neutral-700">
                No common mistakes listed for this lesson.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="print:border-black/20">
                    <TableHead className="print:text-black">Mistake</TableHead>
                    <TableHead className="print:text-black">Example</TableHead>
                    <TableHead className="print:text-black">How to respond</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guide.misconceptions.map((m, i) => (
                    <TableRow key={i} className="print:border-black/20">
                      <TableCell className="align-top font-medium">{m.mistake}</TableCell>
                      <TableCell className="align-top">{m.example}</TableCell>
                      <TableCell className="align-top">{m.respond}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold font-headline">Support and Challenge</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="break-inside-avoid print:border-black/20 print:bg-white print:text-black print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Support</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                {guide.support.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="break-inside-avoid print:border-black/20 print:bg-white print:text-black print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                {guide.challenge.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold font-headline">Exit ticket</h2>
        <Card className="break-inside-avoid print:border-black/20 print:bg-white print:text-black print:shadow-none">
          <CardContent className="pt-6">
            {guide.exitTicket.length === 0 ? (
              <p className="text-sm text-muted-foreground print:text-neutral-700">No exit ticket questions for this lesson.</p>
            ) : (
              <ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed">
                {guide.exitTicket.map((item) => (
                  <li key={item.label}>{item.question}</li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3 print:break-before-page">
        <h2 className="text-xl font-bold font-headline">Answer key</h2>
        <Card className="print:border-black/20 print:bg-white print:text-black print:shadow-none">
          <CardContent className="pt-6">
            <details ref={detailsRef}>
              <summary className="cursor-pointer select-none font-semibold">
                Answer key ({guide.answerKey.length} {guide.answerKey.length === 1 ? "problem" : "problems"})
              </summary>
              <div className="mt-4 space-y-4">
                {guide.answerKey.map((item) => (
                  <div key={item.label} className="break-inside-avoid space-y-1 border-b pb-3 last:border-b-0 last:pb-0 print:border-black/20">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary print:text-black">{item.label}</p>
                    <p className="text-sm">{item.question}</p>
                    <p className="text-sm">
                      Answer: <b>{item.answer}</b>
                    </p>
                    {item.solution.length > 0 && (
                      <ol className="list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground print:text-black">
                        {item.solution.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
