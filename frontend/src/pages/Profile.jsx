import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth.js";
import { getReputationStats, getReviewsForUser } from "../services/api.js";
import { formatDateTimeLocal } from "../utils/datetime.js";

const Motion = motion;

function pill(text) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
      {text}
    </span>
  );
}

export default function Profile() {
  const location = useLocation();
  const { currentUser, role, profile, skills } = useAuth();
  const message = location.state?.message || "";
  const userId = currentUser?.id;
  const [rep, setRep] = useState(null);
  const [reviews, setReviews] = useState([]);

  const fullName =
    profile?.full_name || currentUser?.name || currentUser?.email?.split("@")?.[0] || "User";

  useEffect(() => {
    let cancelled = false;
    if (!userId) return () => {};
    const id = window.setTimeout(() => {
      Promise.all([getReputationStats(userId), getReviewsForUser(userId, { limit: 6 })])
        .then(([a, b]) => {
          if (cancelled) return;
          setRep(a);
          setReviews(b);
        })
        .catch(() => {
          if (cancelled) return;
          setRep(null);
          setReviews([]);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [userId]);

  return (
    <div className="container-app py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-4xl"
      >
        {message ? (
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm font-semibold text-cyan-100">
            {message}
          </div>
        ) : null}

        <div className="glass p-7 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-white">
                {fullName}
              </div>
              <div className="mt-2 text-sm text-white/65">
                {currentUser?.email || "—"}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {pill(role || "user")}
                {pill(`${skills?.length || 0} skills`)}
                {profile?.credits !== undefined && profile?.credits !== null
                  ? pill(`${profile.credits} credits`)
                  : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/edit-profile" className="btn-primary">
                Edit Profile
              </Link>
              <Link to="/wallet" className="btn-secondary">
                Wallet
              </Link>
              <Link to="/home" className="btn-secondary">
                Home
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="glass p-6">
              <div className="text-lg font-extrabold text-white">Bio</div>
              <div className="mt-3 text-sm leading-relaxed text-white/70">
                {profile?.bio
                  ? profile.bio
                  : "Add a short bio so others know what you can teach and what you want to learn."}
              </div>
            </div>

            <div className="glass p-6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-extrabold text-white">Skills</div>
                <Link to="/edit-profile" className="btn-ghost">
                  Manage
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills?.length ? (
                  skills.map((s) => (
                    <span
                      key={`${s.skill_id}-${s.proficiency}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75"
                    >
                      {s.name} · L{s.proficiency}
                    </span>
                  ))
                ) : (
                  <div className="text-sm font-semibold text-white/65">
                    No skills yet. Add at least one skill to explore others.
                  </div>
                )}
              </div>
              {skills?.length ? (
                <div className="mt-6">
                  <Link to="/explore-skills" className="btn-secondary w-full">
                    Explore Skills
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="glass p-6">
              <div className="text-lg font-extrabold text-white">Reputation</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
                  {Number(rep?.avg_rating || 0).toFixed(1)} ★ average
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
                  {rep?.total_reviews || 0} reviews
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
                  {rep?.total_sessions || 0} sessions
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
                  {rep?.credits_earned || 0} credits earned
                </span>
              </div>
              <div className="mt-6">
                <Link to="/sessions" className="btn-secondary w-full">
                  Leave reviews from Sessions
                </Link>
              </div>
            </div>

            <div className="glass p-6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-extrabold text-white">Recent reviews</div>
                <Link to="/notifications" className="btn-ghost">
                  Notifications
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {reviews.length ? (
                  reviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-extrabold text-white">
                          {r.reviewer_name} · {r.rating} ★
                        </div>
                        <div className="text-xs font-semibold text-white/45">
                          {formatDateTimeLocal(r.created_at)}
                        </div>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-white/60">
                        {r.skill_name ? `${r.skill_name}` : "Session"}
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        {r.comment ? r.comment : <span className="text-white/45">No comment</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm font-semibold text-white/65">
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
