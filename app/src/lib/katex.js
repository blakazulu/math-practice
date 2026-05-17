import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import katex from "katex";
export function InlineMath({ text, className }) {
    const parts = useMemo(() => splitOnMath(text), [text]);
    return (_jsx("span", { className: className, children: parts.map((p, i) => p.kind === "text" ? _jsx("span", { children: p.value }, i) : _jsx(MathSpan, { tex: p.value }, i)) }));
}
function MathSpan({ tex }) {
    const html = useMemo(() => {
        try {
            return katex.renderToString(tex, { throwOnError: false, displayMode: false });
        }
        catch {
            return tex;
        }
    }, [tex]);
    return _jsx("span", { dangerouslySetInnerHTML: { __html: html } });
}
function splitOnMath(text) {
    const out = [];
    const re = /\\\(([\s\S]*?)\\\)/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last)
            out.push({ kind: "text", value: text.slice(last, m.index) });
        out.push({ kind: "math", value: m[1] });
        last = m.index + m[0].length;
    }
    if (last < text.length)
        out.push({ kind: "text", value: text.slice(last) });
    return out;
}
