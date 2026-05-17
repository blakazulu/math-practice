import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/store";
import { topicIdFor, urlFromTopicId } from "@/data/types";

export function TopicPickerPage() {
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  useEffect(() => {
    loadBank();
  }, [loadBank]);

  if (!bank) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <PageHeader backTo="/home" title="בחרי נושא" />
          <p className="text-muted">טוען...</p>
        </div>
      </main>
    );
  }

  const cats = bank.categories.filter((c) => c.id !== "sample-exams");

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader backTo="/home" title="בחרי נושא" />
        {cats.map((cat) => (
          <section key={cat.id} className="mb-10">
            <h2 className="section-label mb-4">{cat.name_he}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {cat.topics.map((t) => (
                <Link
                  key={t.id}
                  to={`/practice/${urlFromTopicId(topicIdFor(cat.id, t.id))}`}
                  className="card p-4 lg:p-5 flex items-baseline justify-between gap-2 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span className="font-bold text-lg text-ink truncate">{t.name_he}</span>
                  <span className="text-faint tabular-nums shrink-0">
                    {t.question_count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
