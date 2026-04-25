import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useAuth from "../context/useAuth.js";
import { createReview, getPendingReviews } from "../services/api.js";
import { formatDateLocal, formatTimeOfDay } from "../utils/datetime.js";

const Motion = motion;

function Stars({ value, onChange, disabled }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={[
            "grid h-10 w-10 place-items-center rounded-2xl border text-sm font-extrabold transition",
            value >= n
              ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
              : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
          ].join(" ")}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PendingReviews() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const active = useMemo(() => items[0] || null, [items]);

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getPendingReviews(userId)
      .then((p) => setItems(p))
      .catch((e) => setError(e?.message || "Failed to load pending reviews"))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const id = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const submit = () => {
    if (!userId || !active) return;
    setBusyId(active.session_id);
    setError("");
    createReview({
      sessionId: active.session_id,
      reviewerId: userId,
      reviewedUserId: active.reviewed_user_id,
      rating,
      comment,
    })
      .then(() => {
        setComment("");
        setRating(5);
        load();
      })
      .catch((e) => setError(e?.message || "Failed to submit review"))
      .finally(() => setBusyId(null));
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <Motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-3xl"
      >
        <div className="glass p-7 sm:p-8">
          <div className="text-2xl font-extrabold tracking-tight text-white">
            Pending review required
          </div>
          <div className="mt-2 text-sm text-white/65">
            Please complete your review to continue using the platform.
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass h-28 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-200">
              No pending reviews. You can continue.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${active.session_id}-${active.reviewed_user_id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-6 glass p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-white">
                      Review {active.reviewed_name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white/60">
                      {active.skill_name} · {formatDateLocal(active.scheduled_date)} ·{" "}
                      {formatTimeOfDay(active.start_time)} - {formatTimeOfDay(active.end_time)}
                    </div>
                  </div>
                  <div className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-extrabold text-amber-100">
                    Mandatory
                  </div>
                </div>

                <div className="mt-6">
                  <div className="label">Rating</div>
                  <Stars value={rating} onChange={setRating} disabled={busyId === active.session_id} />
                </div>

                <div className="mt-5">
                  <label className="label" htmlFor="pendingReviewComment">
                    Comment
                  </label>
                  <textarea
                    id="pendingReviewComment"
                    className="input min-h-[130px] resize-none"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a short review…"
                    disabled={busyId === active.session_id}
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary mt-6 w-full"
                  onClick={submit}
                  disabled={busyId === active.session_id}
                >
                  {busyId === active.session_id ? "Submitting…" : "Submit Review"}
                </button>

                <div className="mt-4 text-center text-xs font-semibold text-white/55">
                  Remaining: {items.length}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </Motion.div>
    </div>
  );
}
