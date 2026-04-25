import { Navigate, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import useAuth from "../context/useAuth.js";

const Motion = motion;

export default function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-app grid min-h-[calc(100vh-64px)] place-items-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md p-8 text-center"
        >
          <div className="text-sm font-extrabold text-white">Loading…</div>
          <div className="mt-2 text-sm text-white/65">Preparing your session</div>
        </motion.div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
