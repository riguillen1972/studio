import React from "react";
import { cn } from "@/lib/utils";

// Minimal Markdown renderer for AI answers: headings, bullet/numbered lists,
// paragraphs, **bold**, *italic* and `code`. It builds React elements
// (no raw HTML), so AI output can't inject markup.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "p"; lines: string[] };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const prev = blocks[blocks.length - 1];

    if (!line.trim()) {
      blocks.push({ type: "p", lines: [] }); // paragraph break
    } else if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
    } else if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      const text = (bullet ?? numbered)![1];
      if (prev && prev.type === type) prev.items.push(text);
      else blocks.push({ type, items: [text] });
    } else if (prev && prev.type === "p") {
      prev.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }
  return blocks.filter((b) => b.type !== "p" || b.lines.length > 0);
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  const blocks = parseBlocks(children ?? "");
  return (
    <div className={cn("space-y-2 break-words", className)}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        if (block.type === "heading") {
          return (
            <p key={key} className={cn("font-semibold", block.level <= 2 && "text-base")}>
              {renderInline(block.text, key)}
            </p>
          );
        }
        if (block.type !== "p") {
          const List = block.type;
          return (
            <List key={key} className={cn("space-y-1 pl-5", block.type === "ul" ? "list-disc" : "list-decimal")}>
              {block.items.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={key}>
            {block.lines.map((line, j) => (
              <React.Fragment key={`${key}-${j}`}>
                {j > 0 && <br />}
                {renderInline(line, `${key}-${j}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
