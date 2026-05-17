import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Props {
  triggerKey: number;
}

export function StarBurst({ triggerKey }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (triggerKey === 0) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1200);
    return () => window.clearTimeout(t);
  }, [triggerKey]);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <Star size={64} className="text-warn-700 fill-warn-200 animate-star-fly" />
    </div>
  );
}
