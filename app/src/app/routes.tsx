import { Navigate, Route, Routes } from "react-router-dom";
import { WelcomePage } from "@/pages/WelcomePage";
import { HomePage } from "@/pages/HomePage";
import { SettingsPage } from "@/pages/SettingsPage";
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
      <Route
        path="/"
        element={<Navigate to={activeUserId ? "/home" : "/welcome"} replace />}
      />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/practice" element={<TopicPickerPage />} />
      <Route path="/practice/:topicId" element={<PracticePage />} />
      <Route path="/practice/:topicId/results" element={<PracticeResultsPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/exam" element={<ExamPickerPage />} />
      <Route path="/exam/:examId" element={<ExamPage />} />
      <Route path="/exam/:examId/results" element={<ExamResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
