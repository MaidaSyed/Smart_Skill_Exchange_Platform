import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestOnlyRoute from "./GuestOnlyRoute.jsx";
import SkillGuardRoute from "./SkillGuardRoute.jsx";
import PendingReviewGuardRoute from "./PendingReviewGuardRoute.jsx";
import Profile from "../pages/Profile.jsx";
import EditProfile from "../pages/EditProfile.jsx";
import ExploreSkills from "../pages/ExploreSkills.jsx";
import Messages from "../pages/Messages.jsx";
import Notifications from "../pages/Notifications.jsx";
import MyRequests from "../pages/MyRequests.jsx";
import Sessions from "../pages/Sessions.jsx";
import Wallet from "../pages/Wallet.jsx";
import Admin from "../pages/Admin.jsx";
import PendingReviews from "../pages/PendingReviews.jsx";
import useAuth from "../context/useAuth.js";

export default function AppRoutes() {
  const { currentUser, role, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {role === "admin" ? (
            <>
              <Route path="/admin" element={<Admin />} />
              <Route path="/pending-reviews" element={<Navigate to="/admin" replace />} />
              <Route path="/home" element={<Navigate to="/admin" replace />} />
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/profile" element={<Navigate to="/admin" replace />} />
              <Route path="/edit-profile" element={<Navigate to="/admin" replace />} />
              <Route path="/messages" element={<Navigate to="/admin" replace />} />
              <Route path="/notifications" element={<Navigate to="/admin" replace />} />
              <Route path="/my-requests" element={<Navigate to="/admin" replace />} />
              <Route path="/sessions" element={<Navigate to="/admin" replace />} />
              <Route path="/wallet" element={<Navigate to="/admin" replace />} />
              <Route path="/explore-skills" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            <>
              <Route path="/pending-reviews" element={<PendingReviews />} />
              <Route element={<PendingReviewGuardRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/my-requests" element={<MyRequests />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/admin" element={<Navigate to="/home" replace />} />

                <Route element={<SkillGuardRoute />}>
                  <Route path="/explore-skills" element={<ExploreSkills />} />
                </Route>
              </Route>
            </>
          )}
        </Route>

        <Route
          path="*"
          element={<Navigate to={currentUser ? (role === "admin" ? "/admin" : "/home") : "/"} replace />}
        />
      </Route>
    </Routes>
  );
}
