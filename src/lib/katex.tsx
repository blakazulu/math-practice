import { useMemo } from "react";
import katex from "katex";

interface Props {
  text: string;
  className?: string;
}

export function InlineMath({ text, className }: Props) {
  const parts = useMemo(() => splitOnMath(text), [text]);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.kind === "text" ? <span key={i}>{p.value}</span> : <MathSpan key={i} tex={p.value} />,
      )}
    </span>
  );
}

function MathSpan({ tex }: { tex: string }) {
  const display = /\\begin\{/.test(tex);
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: display });
    } catch {
      return tex;
    }
  }, [tex, display]);
  if (display) {
    return <span className="math-block" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

type Part = { kind: "text" | "math"; value: string };

function splitOnMath(text: string): Part[] {
  const out: Part[] = [];
  const re = /\\\(([\s\S]*?)\\\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
    out.push({ kind: "math", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}
