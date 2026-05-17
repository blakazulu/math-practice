import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Calendar, Settings, Target } from "lucide-react";
import {
  selectActiveUser,
  selectReviewQueueSize,
  useStore,
  type AppStore,
} from "@/store";
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
    if (!user) navigate("/welcome", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  if (!user) return null;

  const stats = user.progress.stats;
  const recentTopics = Object.entries(user.progress.topics)
    .sort(([, a], [, b]) => b.attempted - a.attempted)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-6">
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
              className="p-2 rounded-full hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Settings size={20} />
            </Link>
          </div>
        </header>

        <section className="mb-7">
          <h1 className="h1-hero">
            שלום {user.name},
            <br />
            <span className="h1-hero-accent">מה נתאמן היום?</span>
          </h1>
          <p className="text-muted mt-2">3 ניסיונות לכל שאלה, רמז ביניהם.</p>
        </section>

        {reviewSize > 0 && (
          <Link
            to="/review"
            className="card flex items-center gap-3 p-3 mb-4 bg-warn-50 border-warn-200 text-warn-700 font-semibold"
          >
            <Target size={18} />
            <span className="flex-1">{reviewSize} שאלות לחזרה</span>
            <span>חזרה →</span>
          </Link>
        )}

        <section className="grid grid-cols-2 gap-3 mb-6">
          <ModeCard
            to="/practice"
            icon={<BookOpen size={20} />}
            title="תרגול לפי נושא"
            subtitle="3 ניסיונות + רמזים"
            primary
          />
          <ModeCard
            to="/exam"
            icon={<Calendar size={20} />}
            title="מבחן לדוגמה"
            subtitle="24 שאלות · 60 ד׳"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-label">המשך מאיפה שעצרת</div>
          </div>
          {bankError && (
            <p className="text-danger-600 text-sm mb-2">שגיאה בטעינת השאלות: {bankError}</p>
          )}
          {!bank && !bankError && <p className="text-muted text-sm">טוען...</p>}
          {bank &&
            (recentTopics.length === 0 ? (
              <RecentTopicsEmpty />
            ) : (
              <div>
                {recentTopics.map(([topicId, t]) => {
                  const topicMeta = findTopicName(bank, topicId);
                  return (
                    <TopicCard
                      key={topicId}
                      to={`/practice/${encodeURIComponent(topicId)}`}
                      name={topicMeta ?? topicId}
                      attempted={t.attempted}
                      mastered={t.mastered}
                      total={t.totalQuestions}
                    />
                  );
                })}
              </div>
            ))}
        </section>
      </div>
    </main>
  );
}

function RecentTopicsEmpty() {
  return (
    <Link
      to="/practice"
      className="block card p-4 text-center text-muted hover:bg-surface"
    >
      עוד לא התחלת. הקליקי על "תרגול לפי נושא" למעלה כדי לבחור נושא.
    </Link>
  );
}

function findTopicName(
  bank: NonNullable<AppStore["bank"]>,
  topicId: string,
): string | undefined {
  for (const cat of bank.categories) {
    for (const topic of cat.topics) {
      if (topicIdFor(cat.id, topic.id) === topicId) return topic.name_he;
    }
  }
  return undefined;
}
