import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { WelcomePage } from "@/pages/WelcomePage";
import { HomePage } from "@/pages/HomePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { TopicPickerPage } from "@/pages/TopicPickerPage";
import { PracticePage } from "@/pages/PracticePage";
import { PracticeResultsPage } from "@/pages/PracticeResultsPage";
import { ReviewPage } from "@/pages/ReviewPage";
import { ExamPickerPage } from "@/pages/ExamPickerPage";
import { ExamPage } from "@/pages/ExamPage";
import { ExamResultsPage } from "@/pages/ExamResultsPage";
import { useStore } from "@/store";

export function AppRoutes() {
  const activeUserId = useStore((s) => s.activeUserId);
  return (
    <Routes>
      {/* Public landing — also the redirect target for returning users. */}
      <Route
        path="/"
        element={activeUserId ? <Navigate to="/home" replace /> : <LandingPage />}
      />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/practice" element={<TopicPickerPage />} />
      <Route path="/practice/:cat/:topic" element={<PracticePage />} />
      <Route path="/practice/:cat/:topic/results" element={<PracticeResultsPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/exam" element={<ExamPickerPage />} />
      <Route path="/exam/:cat/:topic" element={<ExamPage />} />
      <Route path="/exam/:cat/:topic/results" element={<ExamResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
