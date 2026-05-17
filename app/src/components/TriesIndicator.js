import { jsx as _jsx } from "react/jsx-runtime";
export function TriesIndicator({ used }) {
    const dots = [0, 1, 2];
    return (_jsx("div", { className: "flex items-center gap-1.5", "aria-label": `${3 - used} ניסיונות נותרו`, children: dots.map((i) => (_jsx("span", { className: `block w-2.5 h-2.5 rounded-full ${i < used ? "bg-danger-200" : "bg-brand-500"}` }, i))) }));
}
