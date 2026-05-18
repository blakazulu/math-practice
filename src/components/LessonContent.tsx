import { Fragment, type ReactNode } from "react";
import { InlineMath, BlockMath } from "react-katex";

interface Props {
  body: string;
}

type Block =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ol"; items: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "displayMath"; tex: string };

function parseBlocks(body: string): Block[] {
  const lines = body.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("$$") && line.endsWith("$$") && line.length > 4) {
      blocks.push({ kind: "displayMath", tex: line.slice(2, -2) });
      i++;
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    blocks.push({ kind: "p", text: line });
    i++;
  }
  return blocks;
}

function renderInline(text: string): ReactNode {
  // Split on $...$ pairs. Even indices are plain text, odd indices are math.
  const parts = text.split(/\$([^$]+)\$/g);
  return parts.map((part, idx) =>
    idx % 2 === 0 ? <Fragment key={idx}>{part}</Fragment> : <InlineMath key={idx} math={part} />,
  );
}

export function LessonContent({ body }: Props) {
  const blocks = parseBlocks(body);
  return (
    <div className="lesson-content space-y-4">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h2":
            return (
              <h3 key={i} className="section-label">
                {block.text}
              </h3>
            );
          case "p":
            return <p key={i}>{renderInline(block.text)}</p>;
          case "ol":
            return (
              <ol key={i} className="list-decimal pr-6 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pr-6 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "displayMath":
            return <BlockMath key={i} math={block.tex} />;
        }
      })}
    </div>
  );
}
