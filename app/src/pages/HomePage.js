import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Calendar, Settings, Target } from "lucide-react";
import { selectActiveUser, selectReviewQueueSize, useStore, } from "@/store";
import { topicIdFor } from "@/data/types";
import { StatPill } from "@/components/StatPill";
import { ModeCard } from "@/components/ModeCard";
import { TopicCard } from "@/components/TopicCard";
import { Logo } from "@/components/Logo";
export function HomePage() {
    const user = useStore(selectActiveUser);
    const bank = useStore((s) => s.bank);
    const bankError = useStore((s) => s.bankError);
    const loadBank = useStore((s) => s.loadBank);
    const reviewSize = useStore(selectReviewQueueSize);
    const navigate = useNavigate();
    useEffect(() => {
        if (!user)
            navigate("/welcome", { replace: true });
    }, [user, navigate]);
    useEffect(() => {
        loadBank();
    }, [loadBank]);
    if (!user)
        return null;
    const stats = user.progress.stats;
    const recentTopics = Object.entries(user.progress.topics)
        .sort(([, a], [, b]) => b.attempted - a.attempted)
        .slice(0, 4);
    return (_jsx("main", { className: "min-h-screen bg-white px-4 py-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("header", { className: "flex items-center justify-between mb-6", children: [_jsx(Logo, {}), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(StatPill, { variant: "star", value: stats.starsEarned }), stats.currentStreakDays > 0 && (_jsx(StatPill, { variant: "streak", value: stats.currentStreakDays })), _jsx(Link, { to: "/settings", "aria-label": "\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA", className: "p-2 rounded-full hover:bg-hair", children: _jsx(Settings, { size: 20 }) })] })] }), _jsxs("section", { className: "mb-7", children: [_jsxs("h1", { className: "h1-hero", children: ["\u05E9\u05DC\u05D5\u05DD ", user.name, ",", _jsx("br", {}), _jsx("span", { className: "h1-hero-accent", children: "\u05DE\u05D4 \u05E0\u05EA\u05D0\u05DE\u05DF \u05D4\u05D9\u05D5\u05DD?" })] }), _jsx("p", { className: "text-muted mt-2", children: "3 \u05E0\u05D9\u05E1\u05D9\u05D5\u05E0\u05D5\u05EA \u05DC\u05DB\u05DC \u05E9\u05D0\u05DC\u05D4, \u05E8\u05DE\u05D6 \u05D1\u05D9\u05E0\u05D9\u05D4\u05DD." })] }), reviewSize > 0 && (_jsxs(Link, { to: "/review", className: "card flex items-center gap-3 p-3 mb-4 bg-warn-50 border-warn-200 text-warn-700 font-semibold", children: [_jsx(Target, { size: 18 }), _jsxs("span", { className: "flex-1", children: [reviewSize, " \u05E9\u05D0\u05DC\u05D5\u05EA \u05DC\u05D7\u05D6\u05E8\u05D4"] }), _jsx("span", { children: "\u05D7\u05D6\u05E8\u05D4 \u2192" })] })), _jsxs("section", { className: "grid grid-cols-2 gap-3 mb-6", children: [_jsx(ModeCard, { to: "/practice", icon: _jsx(BookOpen, { size: 20 }), title: "\u05EA\u05E8\u05D2\u05D5\u05DC \u05DC\u05E4\u05D9 \u05E0\u05D5\u05E9\u05D0", subtitle: "3 \u05E0\u05D9\u05E1\u05D9\u05D5\u05E0\u05D5\u05EA + \u05E8\u05DE\u05D6\u05D9\u05DD", primary: true }), _jsx(ModeCard, { to: "/exam", icon: _jsx(Calendar, { size: 20 }), title: "\u05DE\u05D1\u05D7\u05DF \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4", subtitle: "24 \u05E9\u05D0\u05DC\u05D5\u05EA \u00B7 60 \u05D3\u05F3" })] }), _jsxs("section", { children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx("div", { className: "section-label", children: "\u05D4\u05DE\u05E9\u05DA \u05DE\u05D0\u05D9\u05E4\u05D4 \u05E9\u05E2\u05E6\u05E8\u05EA" }) }), bankError && (_jsxs("p", { className: "text-danger-600 text-sm mb-2", children: ["\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05D4\u05E9\u05D0\u05DC\u05D5\u05EA: ", bankError] })), !bank && !bankError && _jsx("p", { className: "text-muted text-sm", children: "\u05D8\u05D5\u05E2\u05DF..." }), bank &&
                            (recentTopics.length === 0 ? (_jsx(RecentTopicsEmpty, {})) : (_jsx("div", { children: recentTopics.map(([topicId, t]) => {
                                    const topicMeta = findTopicName(bank, topicId);
                                    return (_jsx(TopicCard, { to: `/practice/${encodeURIComponent(topicId)}`, name: topicMeta ?? topicId, attempted: t.attempted, mastered: t.mastered, total: t.totalQuestions }, topicId));
                                }) })))] })] }) }));
}
function RecentTopicsEmpty() {
    return (_jsx(Link, { to: "/practice", className: "block card p-4 text-center text-muted hover:bg-surface", children: "\u05E2\u05D5\u05D3 \u05DC\u05D0 \u05D4\u05EA\u05D7\u05DC\u05EA. \u05D4\u05E7\u05DC\u05D9\u05E7\u05D9 \u05E2\u05DC \"\u05EA\u05E8\u05D2\u05D5\u05DC \u05DC\u05E4\u05D9 \u05E0\u05D5\u05E9\u05D0\" \u05DC\u05DE\u05E2\u05DC\u05D4 \u05DB\u05D3\u05D9 \u05DC\u05D1\u05D7\u05D5\u05E8 \u05E0\u05D5\u05E9\u05D0." }));
}
function findTopicName(bank, topicId) {
    for (const cat of bank.categories) {
        for (const topic of cat.topics) {
            if (topicIdFor(cat.id, topic.id) === topicId)
                return topic.name_he;
        }
    }
    return undefined;
}
