import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, BookOpen, Calendar, Lightbulb, Target } from "lucide-react";
import { useStore } from "@/store";
import { Logo } from "@/components/Logo";

export function LandingPage() {
  const navigate = useNavigate();
  const activeUserId = useStore((s) => s.activeUserId);
  const loadBank = useStore((s) => s.loadBank);
  const bank = useStore((s) => s.bank);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  // Returning users skip the landing.
  useEffect(() => {
    if (activeUserId) navigate("/home", { replace: true });
  }, [activeUserId, navigate]);

  const totalQuestions = bank?.total_questions ?? 497;
  const totalTopics = bank?.categories.reduce((n, c) => n + c.topic_count, 0) ?? 23;
  const totalExams =
    bank?.categories.find((c) => c.id === "sample-exams")?.topic_count ?? 7;

  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="border-b border-hair">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 flex items-center justify-between">
          <Logo />
          <Link to="/welcome" className="btn-secondary">
            התחילי כעת
            <ArrowLeft size={18} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="section-label mb-4">תוכנית לנוער מוכשר במתמטיקה</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tightest leading-[1.05] text-ink">
              תרגול חשבון מתקדם<br />
              <span className="h1-hero-accent">לכיתות ו׳.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed max-w-xl">
              הכנה לבחינת הקבלה לתוכניות המחוננים. {totalQuestions} שאלות
              מקוריות, {totalExams} מבחנים שלמים לדוגמה, {totalTopics} נושאים —
              והכל בעברית, בקצב שלכם.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/welcome" className="btn-primary text-base sm:text-lg">
                בואו נתחיל
                <ArrowLeft size={20} />
              </Link>
              <a href="#how-it-works" className="btn-secondary text-base sm:text-lg">
                איך זה עובד?
              </a>
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-3xl p-6 sm:p-8 lg:p-10">
            <p className="section-label mb-3">שאלה לדוגמה</p>
            <p className="text-lg leading-relaxed mb-5">
              במשפחת כהן מספר הילדים קטן מ-16. ידוע כי 25% מהם בנים. כמה בנים יש
              במשפחה?
            </p>
            <ul className="grid grid-cols-2 gap-3 text-base">
              <li className="card p-3 text-center">גדול מ-5</li>
              <li className="card p-3 text-center">בין 0 ל-8</li>
              <li className="card p-3 text-center bg-brand-500 text-white border-brand-600">
                קטן מ-4
              </li>
              <li className="card p-3 text-center">בין 2 ל-4</li>
            </ul>
            <p className="mt-5 text-base text-muted">
              3 ניסיונות, רמז גדל בכל ניסיון, הסבר מלא בסוף.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-surface border-y border-hair">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 grid grid-cols-3 gap-6 sm:gap-10 text-center">
          <Stat number={totalQuestions} label="שאלות מקוריות" />
          <Stat number={totalTopics} label="נושאים" />
          <Stat number={totalExams} label="מבחנים לדוגמה" />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tightest mb-3">
          איך זה <span className="h1-hero-accent">עובד</span>?
        </h2>
        <p className="text-lg text-muted max-w-2xl mb-10">
          הכל לוקח בערך 10 דקות ביום. בלי הרשמה, בלי חשבון — הכל נשמר אצלכם
          במכשיר.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature
            icon={<BookOpen size={24} />}
            title="תרגול לפי נושא"
            body="בוחרים נושא — שברים, אחוזים, גאומטריה, חשיבה מרחבית — ומקבלים שאלה ב-4 אפשרויות. 3 ניסיונות לכל שאלה."
          />
          <Feature
            icon={<Lightbulb size={24} />}
            title="רמזים חכמים"
            body="טעיתם? הרמז גדל בכל ניסיון. הוא לוקח אתכם צעד-צעד דרך הפתרון בלי לתת את התשובה מיד."
          />
          <Feature
            icon={<Calendar size={24} />}
            title="מבחן לדוגמה"
            body="24 שאלות בסדר אמיתי, אופציה לשעון של 60 דקות כמו במבחן הקבלה האמיתי. ציון מלא בסוף, עם פירוט לכל שאלה."
          />
          <Feature
            icon={<Target size={24} />}
            title="חזרה על טעויות"
            body="כל שאלה שטעיתם בה נכנסת לתור חזרה. תוכלו לחזור עליה מתי שתרצו, עד שתפתרו אותה נכון."
          />
          <Feature
            icon={<BookOpen size={24} />}
            title="התקדמות אישית"
            body="כוכב על כל שאלה שתפתרו נכון בפעם הראשונה. רצף ימים. סטטיסטיקות לכל נושא, רק על המכשיר שלכם."
          />
          <Feature
            icon={<Calendar size={24} />}
            title="מותאם לעברית"
            body="ימין-לשמאל. נוסחאות מתמטיות נכונות. עובד באותה איכות בנייד, בטאבלט ובמחשב."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-ink text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tightest mb-4">
            מוכנים <span className="h1-hero-accent">להתחיל</span>?
          </h2>
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-8">
            רושמים את השם הראשי, ומתחילים. בלי דוא"ל, בלי סיסמה — רק את ולמידה.
          </p>
          <Link to="/welcome" className="btn-primary text-lg">
            בואו נתחיל
            <ArrowLeft size={20} />
          </Link>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 text-center text-base text-muted">
        מקור החומר —{" "}
        <a
          href="https://moodle.yuni.co.il/course/view.php?id=4"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-ink"
        >
          התוכניות לנוער מוכשר במתמטיקה
        </a>
      </footer>
    </main>
  );
}

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div>
      <div className="text-4xl sm:text-5xl font-black tabular-nums text-brand-600">
        {number}
      </div>
      <div className="text-base sm:text-lg text-muted mt-1">{label}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6">
      <span className="inline-flex w-12 h-12 rounded-xl bg-brand-100 text-brand-600 items-center justify-center mb-4">
        {icon}
      </span>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-base text-muted leading-relaxed">{body}</p>
    </div>
  );
}
