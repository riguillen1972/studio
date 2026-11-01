"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { questFetch } from "@/components/quest/quest-api";
import { Loader2, Printer } from "lucide-react";

interface Certificate {
  student_id: string; name: string; grade: number | null;
  week_questions: number; week_mastered: string[]; streak: number; badges: number;
}

export default function PrintCertificatePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <Certificates />
    </Suspense>
  );
}

/** This week's certificates, one per printed page: a whole class (teacher) or the student's own. */
function Certificates() {
  const params = useSearchParams();
  const classId = params.get("class_id");
  const tz = params.get("tz") ?? "0";
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyPracticed, setOnlyPracticed] = useState(true);
  const [withVerse, setWithVerse] = useState(true);

  useEffect(() => {
    questFetch<{ certificates: Certificate[] }>(`/api/quest/certificates?tz=${encodeURIComponent(tz)}${classId ? `&class_id=${encodeURIComponent(classId)}` : ""}`)
      .then((d) => setCertificates(d.certificates))
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load certificates."));
  }, [classId, tz]);

  const shown = (certificates ?? []).filter((c) => !onlyPracticed || c.week_questions > 0);
  const week = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-100 text-black print:bg-white">
      <style>{"@media print { @page { size: landscape; margin: 0.4in; } }"}</style>
      <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4">
          <p className="text-sm font-medium">{shown.length} certificate{shown.length === 1 ? "" : "s"}</p>
          {classId && (
            <div className="flex items-center gap-2">
              <Switch id="practiced" checked={onlyPracticed} onCheckedChange={setOnlyPracticed} />
              <Label htmlFor="practiced" className="text-xs">Only students who practiced this week</Label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch id="verse" checked={withVerse} onCheckedChange={setWithVerse} />
            <Label htmlFor="verse" className="text-xs">Bible verse</Label>
          </div>
          <Button size="sm" className="ml-auto" onClick={() => window.print()} disabled={!shown.length}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
      </div>

      {error && <p className="p-8 text-center text-red-700">{error}</p>}
      {!certificates && !error && <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {certificates && !shown.length && <p className="p-8 text-center text-gray-600">No one has practiced this week yet.</p>}

      <div className="mx-auto max-w-4xl space-y-8 p-8 print:max-w-none print:space-y-0 print:p-0">
        {shown.map((c) => (
          <section key={c.student_id} className="break-after-page bg-white p-3 shadow print:shadow-none">
            <div className="border-4 border-double border-amber-700 p-1">
              <div className="flex min-h-[6.2in] flex-col items-center justify-center gap-3 border border-amber-700/60 px-12 py-10 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800">Study Buddy · Math Quest</p>
                <h1 className="font-headline text-4xl font-bold">Certificate of Achievement</h1>
                <p className="text-sm text-gray-600">This certifies that</p>
                <p className="border-b-2 border-gray-400 px-8 pb-1 font-headline text-4xl font-semibold">{c.name}</p>
                <p className="max-w-xl text-base">
                  worked hard in math the week of {week}
                  {c.grade ? ` in grade ${c.grade}` : ""}, answering <strong>{c.week_questions}</strong> practice question{c.week_questions === 1 ? "" : "s"}
                  {c.week_mastered.length ? <> and mastering <strong>{c.week_mastered.length}</strong> skill{c.week_mastered.length === 1 ? "" : "s"}</> : null}
                  {c.streak >= 2 ? <>, with a <strong>{c.streak}-day</strong> practice streak</> : null}.
                </p>
                {c.week_mastered.length > 0 && (
                  <p className="max-w-xl text-sm text-gray-700">Skills mastered: {c.week_mastered.slice(0, 6).join(" · ")}{c.week_mastered.length > 6 ? ` and ${c.week_mastered.length - 6} more` : ""}</p>
                )}
                {withVerse && (
                  <p className="mt-2 max-w-lg text-sm italic text-gray-700">
                    &ldquo;And whatsoever ye do, do it heartily, as to the Lord.&rdquo; <span className="not-italic">Colossians 3:23</span>
                  </p>
                )}
                <div className="mt-6 flex w-full max-w-xl justify-between gap-8 text-sm text-gray-600">
                  <div className="flex-1 border-t border-gray-500 pt-1">Teacher</div>
                  <div className="flex-1 border-t border-gray-500 pt-1">Date</div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
