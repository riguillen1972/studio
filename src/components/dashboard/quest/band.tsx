// Shared colors and labels for score bands (proficient / developing / needs help), so the
// student detail and standards report read the same way. Color never stands alone: every
// band also shows its label or count.

import { bandOf, type Band } from "@/lib/quest/reports";

export const BANDS: { id: Band; label: string; bar: string; text: string }[] = [
  { id: "proficient", label: "Proficient (80+)", bar: "bg-green-600", text: "text-green-700 dark:text-green-400" },
  { id: "developing", label: "Developing (50–79)", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  { id: "needs_help", label: "Needs help (under 50)", bar: "bg-red-500", text: "text-red-700 dark:text-red-400" },
];

export const bandInfo = (score: number) => BANDS.find((b) => b.id === bandOf(score))!;

export function BandLegend({ withNoData = false }: { withNoData?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {BANDS.map((b) => <span key={b.id} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${b.bar}`} />{b.label}</span>)}
      {withNoData && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-muted" />Not started</span>}
    </div>
  );
}
