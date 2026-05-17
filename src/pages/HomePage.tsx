import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Calendar, Settings, Target } from "lucide-react";
import { selectActiveUser, selectReviewQueueSize, useStore } from "@/store";
import { topicIdFor, urlFromTopicId } from "@/data/types";
import type { TopicProgress } from "@/data/types";
import { StatPill } from "@/components/StatPill";
import { Logo } from "@/components/Logo";

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

  // Build a category -> [(topicId, topicMeta, progress)] for the grid.
  const categoryRows = useMemo(() => {
    if (!bank) return [];
    return bank.categories.map((cat) => ({
      id: cat.id,
      name: cat.name_he,
      topics: cat.topics.map((t) => {
        const fullId = topicIdFor(cat.id, t.id);
        return {
          id: fullId,
          name: t.name_he,
          total: t.question_count,
          progress: user?.progress.topics[fullId] as TopicProgress | undefined,
        };
      }),
    }));
  }, [bank, user]);

  if (!user) return null;

  const stats = user.progress.stats;
  const mathCat = categoryRows.find((c) => c.id === "math-knowledge");
  const logicCat = categoryRows.find((c) => c.id === "logic-reasoning");
  const examsCat = categoryRows.find((c) => c.id === "sample-exams");

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

        {/* Hero band */}
        <section className="mb-8 lg:mb-10">
          <p className="section-label mb-3">תרגול חשבון מתקדם · כיתות ו׳</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tightest leading-[1.06] text-ink">
            שלום {user.name},<br />
            <span className="h1-hero-accent">מה נתאמן היום?</span>
          </h1>
          <p className="mt-4 text-lg text-muted max-w-2xl">
            3 ניסיונות לכל שאלה, רמז ביניהם, מבחנים שלמים בסוף.
          </p>
        </section>

        {/* Review queue banner */}
        {reviewSize > 0 && (
          <Link
            to="/review"
            className="card flex items-center gap-3 p-4 mb-8 bg-warn-50 border-warn-200 text-warn-700 font-semibold text-lg"
          >
            <Target size={20} />
            <span className="flex-1">{reviewSize} שאלות לחזרה</span>
            <span>חזרה ←</span>
          </Link>
        )}

        {/* Mode picker — bigger on desktop */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <ModeBigCard
            to="/practice"
            icon={<BookOpen size={28} />}
            title="תרגול לפי נושא"
            subtitle="בחרי תחום, 3 ניסיונות לכל שאלה, רמז ביניהם."
            primary
          />
          <ModeBigCard
            to="/exam"
            icon={<Calendar size={28} />}
            title="מבחן לדוגמה"
            subtitle="24 שאלות, אופציה לשעון של 60 דקות."
          />
        </section>

        {bankError && (
          <p className="text-danger-600 mb-4">שגיאה בטעינת השאלות: {bankError}</p>
        )}
        {!bank && !bankError && <p className="text-muted">טוען נושאים...</p>}

        {/* Math knowledge */}
        {mathCat && (
          <CategorySection title={mathCat.name} topics={mathCat.topics} cta="תרגול" />
        )}

        {/* Logic & reasoning */}
        {logicCat && (
          <CategorySection title={logicCat.name} topics={logicCat.topics} cta="תרגול" />
        )}

        {/* Sample exams */}
        {examsCat && (
          <CategorySection
            title={examsCat.name}
            topics={examsCat.topics}
            cta="מבחן"
            examMode
          />
        )}
      </div>
    </main>
  );
}

function ModeBigCard({
  to,
  icon,
  title,
  subtitle,
  primary,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
}) {
  const base = primary
    ? "bg-brand-500 text-white border-brand-600 shadow-cta active:shadow-cta-pressed active:translate-y-[2px]"
    : "bg-surface border-border hover:border-brand-500";
  return (
    <Link
      to={to}
      className={`card p-6 lg:p-8 flex items-start gap-4 transition-all ${base} focus-visible:ring-2 focus-visible:ring-brand-500`}
    >
      <span
        className={`shrink-0 w-14 h-14 rounded-2xl grid place-items-center ${
          primary ? "bg-white/20" : "bg-brand-100 text-brand-600"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className={`text-xl lg:text-2xl font-bold ${primary ? "text-white" : "text-ink"}`}>
          {title}
        </div>
        <div className={`mt-1 text-base ${primary ? "text-white/85" : "text-muted"}`}>
          {subtitle}
        </div>
      </div>
    </Link>
  );
}

function CategorySection({
  title,
  topics,
  cta,
  examMode,
}: {
  title: string;
  topics: Array<{
    id: string;
    name: string;
    total: number;
    progress?: TopicProgress;
  }>;
  cta: string;
  examMode?: boolean;
}) {
  void cta;
  return (
    <section className="mb-10">
      <h2 className="section-label mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {topics.map((t) => {
          const attempted = t.progress?.attempted ?? 0;
          const mastered = t.progress?.mastered ?? 0;
          const pct = t.total > 0 ? Math.round((mastered / t.total) * 100) : 0;
          const to = examMode
            ? `/exam/${urlFromTopicId(t.id)}`
            : `/practice/${urlFromTopicId(t.id)}`;
          return (
            <Link
              key={t.id}
              to={to}
              className="card p-4 lg:p-5 flex flex-col gap-3 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-lg text-ink truncate">{t.name}</span>
                <span className="text-base text-faint tabular-nums shrink-0">
                  {attempted}/{t.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-hair overflow-hidden">
                <div
                  className="h-full bg-brand-500"
                  style={{ width: `${pct}%` }}
                  aria-label={`${pct} אחוז שליטה`}
                />
              </div>
              <div className="text-base text-muted">
                {attempted === 0
                  ? "עוד לא התחלת"
                  : pct === 100
                    ? "שליטה מלאה"
                    : `${pct}% שליטה`}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
