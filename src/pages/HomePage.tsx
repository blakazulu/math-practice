import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, Target, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { selectActiveUser, selectReviewQueueSize, useStore } from "@/store";
import { topicIdFor, urlFromTopicId } from "@/data/types";
import type { TopicProgress } from "@/data/types";
import { StatPill } from "@/components/StatPill";
import { Logo } from "@/components/Logo";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { Ornament } from "@/components/Ornament";
import { Confetti } from "@/components/Confetti";
import { riseIn, pageEnter, useMotionVariants } from "@/lib/motion";

type OrnamentName = "compass" | "brain-wave" | "sprout-mark";

interface TopicRow {
  id: string;
  name: string;
  total: number;
  progress?: TopicProgress;
}

interface CategoryView {
  id: string;
  name: string;
  topics: TopicRow[];
  ornament: OrnamentName;
  description: string;
  isExam: boolean;
  totalQs: number;
  attempted: number;
  mastered: number;
  pct: number;
}

const CATEGORY_META: Record<
  string,
  { ornament: OrnamentName; description: string; isExam: boolean }
> = {
  "math-knowledge": {
    ornament: "compass",
    description: "שברים, אחוזים, גאומטריה, פעולות חשבון.",
    isExam: false,
  },
  "logic-reasoning": {
    ornament: "brain-wave",
    description: "חשיבה מרחבית, סדרות, רצפים, אנלוגיות.",
    isExam: false,
  },
  "sample-exams": {
    ornament: "sprout-mark",
    description: "מבחנים שלמים בסדר אמיתי. אופציה לשעון 60 דקות.",
    isExam: true,
  },
};

export function HomePage() {
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const bankError = useStore((s) => s.bankError);
  const loadBank = useStore((s) => s.loadBank);
  const reviewSize = useStore(selectReviewQueueSize);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/welcome", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  const categories: CategoryView[] = useMemo(() => {
    if (!bank) return [];
    return bank.categories.map((cat) => {
      const topics: TopicRow[] = cat.topics.map((t) => {
        const fullId = topicIdFor(cat.id, t.id);
        return {
          id: fullId,
          name: t.name_he,
          total: t.question_count,
          progress: user?.progress.topics[fullId] as TopicProgress | undefined,
        };
      });
      const totalQs = topics.reduce((n, t) => n + t.total, 0);
      const attempted = topics.reduce((n, t) => n + (t.progress?.attempted ?? 0), 0);
      const mastered = topics.reduce((n, t) => n + (t.progress?.mastered ?? 0), 0);
      const pct = totalQs > 0 ? Math.round((mastered / totalQs) * 100) : 0;
      const meta = CATEGORY_META[cat.id] ?? {
        ornament: "sprout-mark" as OrnamentName,
        description: "",
        isExam: false,
      };
      return {
        id: cat.id,
        name: cat.name_he,
        topics,
        totalQs,
        attempted,
        mastered,
        pct,
        ornament: meta.ornament,
        description: meta.description,
        isExam: meta.isExam,
      };
    });
  }, [bank, user]);

  const fullName = user?.name ?? "";
  const [typed, setTyped] = useState(fullName);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const lastStreakRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !fullName) {
      setTyped(fullName);
      return;
    }
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(fullName.slice(0, i));
      if (i >= fullName.length) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [fullName]);

  const streakDays = user?.progress.stats.currentStreakDays ?? 0;
  useEffect(() => {
    if (streakDays === 7 && lastStreakRef.current !== 7) {
      setConfettiTrigger((k) => k + 1);
    }
    lastStreakRef.current = streakDays;
  }, [streakDays]);

  if (!user) return null;

  const stats = user.progress.stats;
  const openCategory = openCategoryId
    ? categories.find((c) => c.id === openCategoryId) ?? null
    : null;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Logo />
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <StatPill variant="star" value={stats.starsEarned} />
            {stats.currentStreakDays > 0 && (
              <StatPill variant="streak" value={stats.currentStreakDays} />
            )}
            {stats.todayCount > 0 && <StatPill variant="today" value={stats.todayCount} />}
            <Link
              to="/settings"
              aria-label="הגדרות"
              className="p-3 rounded-full hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Settings size={20} />
            </Link>
          </div>
        </header>

        <section className="relative mb-8 lg:mb-10 overflow-hidden">
          <HeroBackdrop position="top-left" />
          <div className="relative z-10">
            <p className="section-label mb-3">תרגול חשבון מתקדם · כיתות ו׳</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tightest leading-[1.06] text-ink">
              שלום {typed}
              {typed ? "," : ""}
              <br />
              <span className="h1-hero-accent">מה נתאמן היום?</span>
            </h1>
            <p className="mt-4 text-lg text-muted max-w-2xl">
              3 ניסיונות לכל שאלה, רמז ביניהם, מבחנים שלמים בסוף.
            </p>
          </div>
        </section>

        {reviewSize > 0 && (
          <Link
            to="/review"
            className="card flex items-center gap-3 p-4 mb-8 bg-warn-50 border-warn-200 text-warn-700 font-semibold text-lg animate-pulse-glow"
          >
            <Target size={20} />
            <span className="flex-1">{reviewSize} שאלות לחזרה</span>
            <span>חזרה ←</span>
          </Link>
        )}

        {bankError && (
          <p className="text-danger-600 mb-4">שגיאה בטעינת השאלות: {bankError}</p>
        )}
        {!bank && !bankError && <p className="text-muted">טוען נושאים...</p>}

        {categories.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryBlock
                key={cat.id}
                category={cat}
                onOpen={() => setOpenCategoryId(cat.id)}
              />
            ))}
          </section>
        )}
      </div>

      <Confetti trigger={confettiTrigger} />

      <CategoryModal
        category={openCategory}
        onClose={() => setOpenCategoryId(null)}
      />
    </main>
  );
}

function CategoryBlock({
  category,
  onOpen,
}: {
  category: CategoryView;
  onOpen: () => void;
}) {
  const circumference = 2 * Math.PI * 28;
  const dash = (category.pct / 100) * circumference;
  return (
    <button
      onClick={onOpen}
      className="card card-warm relative text-right p-6 lg:p-7 flex flex-col gap-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="w-14 h-14 rounded-2xl grid place-items-center bg-brand-100 text-brand-600">
          <Ornament name={category.ornament} size={28} />
        </span>
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
          <circle cx="32" cy="32" r="28" fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#22C55E"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 32 32)"
          />
          <text
            x="32"
            y="36"
            textAnchor="middle"
            className="fill-ink"
            style={{ fontSize: "16px", fontWeight: 800 }}
          >
            {category.pct}%
          </text>
        </svg>
      </div>

      <div>
        <h3 className="text-xl lg:text-2xl font-bold text-ink leading-tight">{category.name}</h3>
        <p className="mt-1 text-base text-muted leading-relaxed">{category.description}</p>
      </div>

      <div className="mt-auto flex items-center justify-between text-base">
        <span className="text-muted tabular-nums">
          {category.topics.length} {category.isExam ? "מבחנים" : "נושאים"} · {category.totalQs} שאלות
        </span>
        <span className="text-brand-700 font-semibold">פתחי ←</span>
      </div>
    </button>
  );
}

function CategoryModal({
  category,
  onClose,
}: {
  category: CategoryView | null;
  onClose: () => void;
}) {
  const reducedChild = useMotionVariants(riseIn);
  return (
    <AnimatePresence>
      {category && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={category.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 32, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="card w-full max-w-2xl max-h-[88vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-hair">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-11 h-11 rounded-xl grid place-items-center bg-brand-100 text-brand-600 shrink-0">
                  <Ornament name={category.ornament} size={22} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-ink">{category.name}</h2>
                  <p className="text-muted text-base">
                    {category.topics.length} {category.isExam ? "מבחנים" : "נושאים"} ·{" "}
                    {category.totalQs} שאלות
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="סגירה"
                className="shrink-0 rounded-full p-2 hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X size={20} />
              </button>
            </header>

            <motion.ul
              initial="hidden"
              animate="show"
              variants={pageEnter}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2"
            >
              {category.topics.map((t) => {
                const attempted = t.progress?.attempted ?? 0;
                const mastered = t.progress?.mastered ?? 0;
                const pct = t.total > 0 ? Math.round((mastered / t.total) * 100) : 0;
                const to = category.isExam
                  ? `/exam/${urlFromTopicId(t.id)}`
                  : `/practice/${urlFromTopicId(t.id)}`;
                const c = 2 * Math.PI * 12;
                return (
                  <motion.li key={t.id} variants={reducedChild}>
                    <Link
                      to={to}
                      onClick={onClose}
                      className="card flex items-center gap-3 p-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="shrink-0">
                        <circle cx="16" cy="16" r="12" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${(pct / 100) * c} ${c}`}
                          transform="rotate(-90 16 16)"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg text-ink leading-snug">{t.name}</div>
                        <div className="text-base text-muted mt-0.5 tabular-nums">
                          {attempted === 0
                            ? `${t.total} שאלות`
                            : pct === 100
                              ? "שליטה מלאה"
                              : `${attempted}/${t.total} · ${pct}% שליטה`}
                        </div>
                      </div>
                      <span className="shrink-0 text-brand-700 font-semibold">
                        {category.isExam ? "התחלי ←" : "תרגלי ←"}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
