import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "../context/useAuth.js";
import { hasPendingReviews } from "../services/api.js";

export default function PendingReviewGuardRoute() {
  const { currentUser, role } = useAuth();
  const userId = currentUser?.id;
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (role === "admin") return () => {};
    if (!userId) return () => {};
    const id = window.setTimeout(() => {
      hasPendingReviews(userId)
        .then((pending) => {
          if (cancelled) return;
          setChecked(true);
          if (pending && location.pathname !== "/pending-reviews") {
            navigate("/pending-reviews", { replace: true });
          }
        })
        .catch(() => {
          if (cancelled) return;
          setChecked(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [location.pathname, navigate, role, userId]);

  if (role === "admin") return <Outlet />;
  if (!checked) return null;
  return <Outlet />;
}
