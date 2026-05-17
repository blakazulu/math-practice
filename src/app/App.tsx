import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";
import { GrainOverlay } from "@/components/GrainOverlay";

// Hydrate localStorage synchronously at module load to avoid a Welcome-flash
// for returning users on first render.
useStore.getState().hydrate();

export function App() {
  const loadBank = useStore((s) => s.loadBank);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  return (
    <BrowserRouter>
      <GrainOverlay />
      <AppRoutes />
    </BrowserRouter>
  );
}
