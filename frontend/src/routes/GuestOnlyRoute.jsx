import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../context/useAuth.js";

export default function GuestOnlyRoute() {
  const { currentUser, role, loading } = useAuth();

  if (loading) return null;
  if (currentUser) return <Navigate to={role === "admin" ? "/admin" : "/home"} replace />;
  return <Outlet />;
}
