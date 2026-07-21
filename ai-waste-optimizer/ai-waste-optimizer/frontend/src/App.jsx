import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import AdminLayout from "./layouts/AdminLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import UserLayout from "./layouts/UserLayout";
import DriverLayout from "./layouts/DriverLayout";

import Dashboard from "./pages/Admin/Dashboard";
import ManagerDashboard from "./pages/Manager/Dashboard";
import RouteDispatch from "./pages/Manager/RouteDispatch";
import ManagerAnalytics from "./pages/Manager/Analytics";
import ManagerFleet from "./pages/Manager/Fleet";
import Reports from "./pages/Admin/Reports";
import Fleet from "./pages/Admin/Fleet";
import Users from "./pages/Admin/Users";
import Settings from "./pages/Admin/Settings";
import AdminRoutes from "./pages/Admin/Routes";

import CitizenDashboard from "./pages/User/Dashboard";
import Feedback from "./pages/User/Feedback";
import Schedule from "./pages/User/Schedule";
import Status from "./pages/User/Status";
import Profile from "./pages/User/Profile";

import DriverDashboard from "./pages/Driver/Dashboard";
import RouteView from "./pages/Driver/RouteView";

function LoadingScreen() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: "3px solid #E2E8F0",
        borderTopColor: "#22C55E", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#94A3B8", fontSize: 14 }}>Loading...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User (Citizen) Routes */}
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CitizenDashboard />} />
              <Route path="reports" element={<Status />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="routes" element={<AdminRoutes />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Manager Routes */}
            <Route path="/manager" element={<ManagerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="routes" element={<RouteDispatch />} />
              <Route path="analytics" element={<ManagerAnalytics />} />
              <Route path="fleet" element={<ManagerFleet />} />
            </Route>

            {/* Driver Routes */}
            <Route path="/driver" element={<DriverLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DriverDashboard />} />
              <Route path="route" element={<RouteView />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
