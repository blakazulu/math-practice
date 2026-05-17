import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: activeUserId ? "/home" : "/welcome", replace: true }) }), _jsx(Route, { path: "/welcome", element: _jsx(WelcomePage, {}) }), _jsx(Route, { path: "/home", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "/practice", element: _jsx(TopicPickerPage, {}) }), _jsx(Route, { path: "/practice/:topicId", element: _jsx(PracticePage, {}) }), _jsx(Route, { path: "/practice/:topicId/results", element: _jsx(PracticeResultsPage, {}) }), _jsx(Route, { path: "/review", element: _jsx(ReviewPage, {}) }), _jsx(Route, { path: "/exam", element: _jsx(ExamPickerPage, {}) }), _jsx(Route, { path: "/exam/:examId", element: _jsx(ExamPage, {}) }), _jsx(Route, { path: "/exam/:examId/results", element: _jsx(ExamResultsPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
