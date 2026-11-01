// Builds a CSV file in the browser and downloads it (opens cleanly in Excel and Google Sheets).

type Cell = string | number | boolean | null | undefined;

const escape = (v: Cell) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(escape).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, rows: Cell[][]) {
  // The BOM tells Excel the file is UTF-8, so accented names show correctly
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "Grade 7 Fractions" → "grade-7-fractions" for file names. */
export const fileSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
