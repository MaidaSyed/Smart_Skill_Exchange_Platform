import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useAuth from "../context/useAuth.js";
import { createReview, getSessions } from "../services/api.js";
import { buildLocalDateTime, formatDateLocal, formatDateTimeLocal, formatTimeOfDay } from "../utils/datetime.js";

const Motion = motion;

function isChatActive(chatEnabledAt, chatExpiresAt) {
  if (!chatEnabledAt || !chatExpiresAt) return false;
  const a = new Date(chatEnabledAt).getTime();
  const b = new Date(chatExpiresAt).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  const now = Date.now();
  return now >= a && now <= b;
}

function countdownLabel(msUntil) {
  if (!Number.isFinite(msUntil)) return "";
  if (msUntil <= 0) return "Starts now";
  const totalMinutes = Math.ceil(msUntil / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `Starts in ${minutes}m`;
  return `Starts in ${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export default function Sessions() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [reviewFor, setReviewFor] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getSessions(userId)
      .then((s) => setSessions(s))
      .catch((e) => setError(e?.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const id = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 20000);
    return () => window.clearInterval(id);
  }, []);

  const reviewedUserId = useMemo(() => {
    if (!reviewFor || !userId) return null;
    if (reviewFor.required_reviewed_user_id) return reviewFor.required_reviewed_user_id;
    return String(reviewFor.teacher_id) === String(userId) ? reviewFor.learner_id : reviewFor.teacher_id;
  }, [reviewFor, userId]);

  const reviewedName = useMemo(() => {
    if (!reviewFor || !userId) return "";
    if (reviewFor.required_reviewed_user_id) {
      return String(reviewFor.required_reviewed_user_id) === String(reviewFor.teacher_id) ? reviewFor.teacher_name : reviewFor.learner_name;
    }
    return String(reviewFor.teacher_id) === String(userId) ? reviewFor.learner_name : reviewFor.teacher_name;
  }, [reviewFor, userId]);

  const submitReview = () => {
    if (!reviewFor || !userId || !reviewedUserId) return;
    setReviewBusy(true);
    setReviewError("");
    setReviewMsg("");
    createReview({
      sessionId: reviewFor.id,
      reviewerId: userId,
      reviewedUserId,
      rating: reviewRating,
      comment: reviewComment,
    })
      .then(() => {
        setReviewMsg("Review submitted");
        setReviewFor(null);
        setReviewComment("");
        setReviewRating(5);
        load();
      })
      .catch((e) => setReviewError(e?.message || "Failed to submit review"))
      .finally(() => setReviewBusy(false));
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <AnimatePresence>
        {reviewFor ? (
          <motion.div
            className="fixed inset-0 z-[90] grid place-items-center px-4 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setReviewFor(null)}
              aria-label="Close"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="glass relative w-full max-w-lg max-h-[85vh] overflow-y-auto p-7 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-extrabold text-white">Leave a review</div>
                  <div className="mt-1 text-sm text-white/65">
                    {reviewedName ? `Review ${reviewedName}` : "Review user"}
                  </div>
                </div>
                <button type="button" className="btn-ghost" onClick={() => setReviewFor(null)}>
                  Close
                </button>
              </div>

              {reviewError ? (
                <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
                  {reviewError}
                </div>
              ) : null}

              <div className="mt-6">
                <div className="label">Rating</div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={reviewRating === n ? "btn-primary" : "btn-secondary"}
                      onClick={() => setReviewRating(n)}
                      disabled={reviewBusy}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="label" htmlFor="reviewComment">
                  Comment
                </label>
                <textarea
                  id="reviewComment"
                  className="input min-h-[120px] resize-none"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share what was good and what can improve…"
                  disabled={reviewBusy}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" className="btn-secondary" onClick={() => setReviewFor(null)} disabled={reviewBusy}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={submitReview} disabled={reviewBusy}>
                  {reviewBusy ? "Submitting…" : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div>
          <div className="text-3xl font-extrabold tracking-tight text-white">
            Sessions
          </div>
          <div className="mt-2 text-sm text-white/65">
            Upcoming scheduled sessions (as learner or teacher).
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        ) : null}
        {reviewMsg ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-200">
            {reviewMsg}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass h-44 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {sessions.map((s) => (
              <div key={s.id} className="glass p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold text-white">
                      {s.skill_name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white/60">
                      {s.category || "Uncategorized"} · {s.skill_type || "General"} · L{s.proficiency}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-extrabold text-white/80">
                      {s.status || "scheduled"}
                    </div>
                    <div
                      className={[
                        "rounded-full border px-3 py-1 text-[11px] font-extrabold",
                        isChatActive(s.chat_enabled_at, s.chat_expires_at)
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                          : "border-amber-400/25 bg-amber-400/10 text-amber-100",
                      ].join(" ")}
                    >
                      {isChatActive(s.chat_enabled_at, s.chat_expires_at) ? "Chat Active" : "Chat Expired"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-white/70">
                  <div>
                    <span className="font-extrabold text-white/85">Teacher:</span>{" "}
                    {s.teacher_name || "Teacher"}
                  </div>
                  <div>
                    <span className="font-extrabold text-white/85">Learner:</span>{" "}
                    {s.learner_name || "Learner"}
                  </div>
                  <div>
                    <span className="font-extrabold text-white/85">Date:</span>{" "}
                    {formatDateLocal(s.scheduled_date)}
                  </div>
                  <div>
                    <span className="font-extrabold text-white/85">Time:</span>{" "}
                    {formatTimeOfDay(s.start_time)} - {formatTimeOfDay(s.end_time)}
                  </div>
                  <div>
                    <span className="font-extrabold text-white/85">Duration:</span>{" "}
                    {s.duration_minutes || 60} min
                  </div>
                  <div>
                    <span className="font-extrabold text-white/85">Chat ends on:</span>{" "}
                    {formatDateTimeLocal(s.chat_expires_at)}
                  </div>
                </div>

                <div className="mt-6">
                  {(() => {
                    if (!s.meeting_link) {
                      return (
                        <button type="button" className="btn-secondary w-full" disabled>
                          Meeting link unavailable
                        </button>
                      );
                    }

                    if (s.status !== "scheduled" && s.status !== "in_progress") {
                      return (
                        <button type="button" className="btn-secondary w-full" disabled>
                          Session {s.status}
                        </button>
                      );
                    }

                    const start = buildLocalDateTime(s.scheduled_date, s.start_time);
                    const end =
                      buildLocalDateTime(s.scheduled_date, s.end_time) ||
                      (start
                        ? new Date(start.getTime() + (Number(s.duration_minutes) || 60) * 60000)
                        : null);

                    if (!start || !end) {
                      return (
                        <button type="button" className="btn-secondary w-full" disabled>
                          Join meeting unavailable
                        </button>
                      );
                    }

                    if (nowMs < start.getTime()) {
                      return (
                        <button type="button" className="btn-secondary w-full" disabled>
                          {countdownLabel(start.getTime() - nowMs)}
                        </button>
                      );
                    }

                    if (nowMs > end.getTime()) {
                      return (
                        <button type="button" className="btn-secondary w-full" disabled>
                          Session Completed
                        </button>
                      );
                    }

                    return (
                      <a className="btn-primary w-full text-center" href={s.meeting_link} target="_blank" rel="noreferrer">
                        Join meeting
                      </a>
                    );
                  })()}
                </div>

                <div className="mt-3">
                  {s.required_reviewed_user_id ? (
                    <button
                      type="button"
                      className="btn-secondary w-full"
                      onClick={() => {
                        setReviewError("");
                        setReviewFor(s);
                        setReviewComment("");
                        setReviewRating(5);
                      }}
                      disabled={!s.can_review_now || s.has_reviewed_required}
                    >
                      {s.has_reviewed_required ? "Review Submitted" : s.can_review_now ? "Leave review" : "Review available after session"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}

            {sessions.length === 0 ? (
              <div className="glass p-6 text-sm font-semibold text-white/70 md:col-span-2">
                No sessions scheduled yet.
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
