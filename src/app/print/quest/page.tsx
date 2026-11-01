"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questFetch } from "@/components/quest/quest-api";
import { Loader2, Printer, Shuffle } from "lucide-react";
import { WorksheetSheet, type WorksheetSkill } from "@/components/quest/worksheet-sheet";


export default function PrintQuestPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <Worksheet />
    </Suspense>
  );
}

/** Printable worksheet for one or more skills, with an optional answer key on its own page. */
function Worksheet() {
  const params = useSearchParams();
  const skillIds = params.get("skills") ?? "";
  const [title, setTitle] = useState(params.get("title") ?? "Math practice");
  const [per, setPer] = useState(params.get("per") ?? "6");
  const [withKey, setWithKey] = useState(true);
  const [withExplanations, setWithExplanations] = useState(true);
  const [skills, setSkills] = useState<WorksheetSkill[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setSkills(null);
    setError(null);
    try {
      const data = await questFetch<{ skills: WorksheetSkill[] }>(`/api/quest/print?skills=${encodeURIComponent(skillIds)}&per=${per}`);
      setSkills(data.skills);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the worksheet.");
    }
  }, [skillIds, per]);

  useEffect(() => { load(); }, [load]);

  const printable = (skills ?? []).filter((s) => s.questions.length > 0);
  const skipped = (skills ?? []).filter((s) => s.questions.length === 0);
  const grades = [...new Set(printable.map((s) => s.section))];
  const subtitle = [
    grades.length === 1 ? (grades[0] <= 5 ? "Foundations" : `Grade ${grades[0]}`) : null,
    [...new Set(printable.map((s) => s.nad).filter(Boolean))].map((n) => `NAD ${n}`).join(", ") || null,
  ].filter(Boolean).join(" · ");
  let number = 0;
  const numbered = printable.map((s) => ({ ...s, questions: s.questions.map((q) => ({ ...q, n: ++number })) }));

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Controls (not printed) */}
      <div className="sticky top-0 z-10 border-b bg-white/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-end gap-4">
          <div className="grid gap-1">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 w-56" />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Questions per skill</Label>
            <Select value={per} onValueChange={setPer}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>{["3", "4", "6", "8", "10", "15"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Switch id="key" checked={withKey} onCheckedChange={setWithKey} />
            <Label htmlFor="key" className="text-xs">Answer key</Label>
          </div>
          {withKey && (
            <div className="flex items-center gap-2 pb-1">
              <Switch id="explain" checked={withExplanations} onCheckedChange={setWithExplanations} />
              <Label htmlFor="explain" className="text-xs">Explanations in key</Label>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={load} title="Pick different questions"><Shuffle className="mr-2 h-4 w-4" /> New version</Button>
            <Button size="sm" onClick={() => window.print()} disabled={!printable.length}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </div>
        </div>
        {skipped.length > 0 && (
          <p className="mx-auto mt-2 max-w-3xl text-xs text-amber-700">
            Left out (no ready questions yet): {skipped.map((s) => `${s.code} ${s.name}`).join(", ")}
          </p>
        )}
      </div>

      {error && <p className="p-8 text-center text-red-700">{error}</p>}
      {!skills && !error && <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {skills && !printable.length && !error && (
        <p className="p-8 text-center text-gray-600">None of these skills have ready questions yet. Fill them in the question bank first.</p>
      )}

      {printable.length > 0 && (
        <WorksheetSheet title={title} subtitle={subtitle} skills={numbered} withKey={withKey} withExplanations={withExplanations} />
      )}
    </div>
  );
}
