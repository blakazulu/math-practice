import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";
import { GrainOverlay } from "@/components/GrainOverlay";
import { InstallPromptSheet } from "@/components/InstallPromptSheet";

// Hydrate localStorage synchronously at module load to avoid a Welcome-flash
// for returning users on first render.
useStore.getState().hydrate();

export function App() {
  const loadBank = useStore((s) => s.loadBank);
  const loadLessons = useStore((s) => s.loadLessons);

  useEffect(() => {
    loadBank();
    loadLessons();
  }, [loadBank, loadLessons]);

  return (
    <BrowserRouter>
      <GrainOverlay />
      <InstallPromptSheet />
      <AppRoutes />
    </BrowserRouter>
  );
}
