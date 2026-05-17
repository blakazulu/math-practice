import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/store";
import { topicIdFor } from "@/data/types";
export function TopicPickerPage() {
    const bank = useStore((s) => s.bank);
    const loadBank = useStore((s) => s.loadBank);
    useEffect(() => {
        loadBank();
    }, [loadBank]);
    if (!bank) {
        return (_jsx("main", { className: "min-h-screen bg-white px-4 py-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05D1\u05D7\u05E8\u05D9 \u05E0\u05D5\u05E9\u05D0" }), _jsx("p", { className: "text-muted", children: "\u05D8\u05D5\u05E2\u05DF..." })] }) }));
    }
    const cats = bank.categories.filter((c) => c.id !== "sample-exams");
    return (_jsx("main", { className: "min-h-screen bg-white px-4 py-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05D1\u05D7\u05E8\u05D9 \u05E0\u05D5\u05E9\u05D0" }), cats.map((cat) => (_jsxs("section", { className: "mb-6", children: [_jsx("h2", { className: "section-label mb-2", children: cat.name_he }), _jsx("div", { className: "card divide-y divide-hair", children: cat.topics.map((t) => (_jsxs(Link, { to: `/practice/${encodeURIComponent(topicIdFor(cat.id, t.id))}`, className: "flex items-center justify-between px-4 py-3 hover:bg-surface", children: [_jsx("span", { className: "font-semibold", children: t.name_he }), _jsxs("span", { className: "text-sm text-faint tabular-nums", children: [t.question_count, " \u05E9\u05D0\u05DC\u05D5\u05EA"] })] }, t.id))) })] }, cat.id)))] }) }));
}
