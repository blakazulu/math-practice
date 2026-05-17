import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";

export function App() {
  const hydrate = useStore((s) => s.hydrate);
  const loadBank = useStore((s) => s.loadBank);

  useEffect(() => {
    hydrate();
    loadBank();
  }, [hydrate, loadBank]);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
