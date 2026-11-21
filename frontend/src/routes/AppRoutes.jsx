import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import StudentDashboard from "../pages/student/StudentDashboard";
import TakeExam from "../pages/student/TakeExam";

import AdminDashboard from "../pages/admin/AdminDashboard";
import ExamManagement from "../pages/admin/ExamManagement";
import UserManagement from "../pages/admin/UserManagement";
import AIReports from "../pages/admin/AIReports";
import ProtectedRoute from "../components/ProtectedRoute";

import Result from "../pages/student/Result";

import StudentHistory from "../pages/student/StudentHistory";

import StudentPerformance from "../pages/admin/StudentPerformance";

import AdvancedAnalytics from "../pages/admin/AdvancedAnalytics";
import AttemptDetails from "../pages/admin/AttemptDetails";

import QuestionManagement from "../pages/admin/QuestionManagement";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/student/dashboard"
        element={
            <ProtectedRoute role="student">
            <StudentDashboard />
            </ProtectedRoute>
        }
      />
      <Route
        path="/student/exam"
        element={
            <ProtectedRoute role="student">
            <TakeExam />
            </ProtectedRoute>
        }
      />
      <Route
        path="/student/history"
        element={
          <ProtectedRoute role="student">
            <StudentHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
            <ProtectedRoute role="admin">
            <AdminDashboard />
            </ProtectedRoute>
        }
      />
      <Route
        path="/admin/exams"
        element={
            <ProtectedRoute role="admin">
            <ExamManagement />
            </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
            <ProtectedRoute role="admin">
            <UserManagement />
            </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
            <ProtectedRoute role="admin">
            <AIReports />
            </ProtectedRoute>
        }
      />
      <Route
        path="/student/result/:attemptId"
        element={
          <ProtectedRoute role="student">
            <Result />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/student-performance"
        element={
          <ProtectedRoute role="admin">
            <StudentPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/advanced-analytics"
        element={
          <ProtectedRoute role="admin">
            <AdvancedAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/attempt/:id"
        element={
          <ProtectedRoute role="admin">
            <AttemptDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/questions"
        element={
          <ProtectedRoute role="admin">
            <QuestionManagement />
          </ProtectedRoute>
        }
      />
      
    </Routes>
  );
}

export default AppRoutes;