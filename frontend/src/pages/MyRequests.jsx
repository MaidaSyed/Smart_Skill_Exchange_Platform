import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useAuth from "../context/useAuth.js";
import {
  acceptRequest,
  getReceivedRequests,
  getSentRequests,
  rejectRequest,
} from "../services/api.js";
import { formatDateLocal, formatTimeOfDay } from "../utils/datetime.js";

const Motion = motion;

function badgeClass(status) {
  if (status === "accepted") return "bg-emerald-500/15 text-emerald-200 border-emerald-500/20";
  if (status === "rejected") return "bg-rose-500/15 text-rose-200 border-rose-500/20";
  if (status === "cancelled") return "bg-white/10 text-white/70 border-white/10";
  return "bg-cyan-400/10 text-cyan-100 border-cyan-400/20";
}

function exchangeSummary(r) {
  if (r.exchange_type === "credits") {
    return r.offered_credit_amount ? `${r.offered_credit_amount} Credits` : "Credits";
  }
  if (r.exchange_type === "skill") {
    return r.offered_skill_name ? `Skill (${r.offered_skill_name})` : "Skill";
  }
  return "—";
}

function RequestCard({ kind, r, onAccept, onReject, busy }) {
  const title =
    kind === "sent"
      ? `To: ${r.teacher_name || "Teacher"}`
      : `From: ${r.learner_name || "Learner"}`;

  return (
    <div className="glass p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-extrabold text-white">{title}</div>
          <div className="mt-2 text-lg font-extrabold text-white">{r.skill_name}</div>
          <div className="mt-1 text-xs font-semibold text-white/60">
            {r.category || "Uncategorized"} · {r.skill_type || "General"} · L{r.proficiency}
          </div>
        </div>
        <div className={["rounded-full border px-3 py-1 text-xs font-extrabold", badgeClass(r.status)].join(" ")}>
          {r.status}
        </div>
      </div>

      <div className="mt-4 text-sm text-white/75">
        {r.message ? r.message : <span className="text-white/55">No message</span>}
      </div>

      <div className="mt-4 grid gap-2 text-xs font-semibold text-white/60 sm:grid-cols-3">
        <div>
          <span className="text-white/80">Date:</span> {formatDateLocal(r.preferred_date)}
        </div>
        <div>
          <span className="text-white/80">Time:</span> {formatTimeOfDay(r.preferred_start_time)}
        </div>
        <div>
          <span className="text-white/80">Duration:</span> {r.duration_minutes ? `${r.duration_minutes} min` : "—"}
        </div>
      </div>

      <div className="mt-3 text-xs font-semibold text-white/60">
        <span className="text-white/80">Exchange:</span> {exchangeSummary(r)}
      </div>

      {kind === "received" && r.status === "pending" ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn-secondary" onClick={() => onReject(r)} disabled={busy}>
            Reject
          </button>
          <button type="button" className="btn-primary" onClick={() => onAccept(r)} disabled={busy}>
            Accept
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function MyRequests() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [tab, setTab] = useState("sent");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [confirmAccept, setConfirmAccept] = useState(null);

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    setMessage("");

    Promise.all([getSentRequests(userId), getReceivedRequests(userId)])
      .then(([a, b]) => {
        setSent(a);
        setReceived(b);
      })
      .catch((e) => setError(e?.message || "Failed to load requests"))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const id = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const items = useMemo(() => (tab === "sent" ? sent : received), [received, sent, tab]);

  const onAccept = (r) => setConfirmAccept(r);

  const confirmAcceptNow = () => {
    if (!confirmAccept?.id || !userId) return;
    setBusy(true);
    setError("");
    setMessage("");
    acceptRequest(confirmAccept.id, { teacherId: userId })
      .then(() => {
        setMessage("Request accepted and session created");
        setConfirmAccept(null);
        load();
      })
      .catch((e) => setError(e?.message || "Failed to accept"))
      .finally(() => setBusy(false));
  };

  const onReject = (r) => {
    if (!r?.id || !userId) return;
    setBusy(true);
    setError("");
    setMessage("");
    rejectRequest(r.id, { teacherId: userId })
      .then(() => {
        setMessage("Request rejected");
        load();
      })
      .catch((e) => setError(e?.message || "Failed to reject"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <AnimatePresence>
        {confirmAccept ? (
          <motion.div
            className="fixed inset-0 z-[90] grid place-items-center px-4 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setConfirmAccept(null)}
              aria-label="Close"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="glass relative w-full max-w-lg p-7 sm:p-8"
            >
              <div className="text-lg font-extrabold text-white">Confirm Acceptance</div>
              <div className="mt-2 text-sm text-white/65">
                Review the exchange details before accepting.
              </div>

              <div className="mt-6 space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-white/60">Requested skill</div>
                  <div className="font-extrabold text-white">{confirmAccept.skill_name}</div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-white/60">Exchange method</div>
                  <div className="font-extrabold text-white">
                    {confirmAccept.exchange_type === "credits" ? "Credits" : "Skill"}
                  </div>
                </div>
                {confirmAccept.exchange_type === "credits" ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-white/60">Credits</div>
                    <div className="font-extrabold text-white">
                      {confirmAccept.offered_credit_amount ? `${confirmAccept.offered_credit_amount}` : "—"}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-white/60">Learner teaches</div>
                    <div className="font-extrabold text-white">
                      {confirmAccept.offered_skill_name || "—"}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmAccept(null)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmAcceptNow}
                  disabled={busy}
                >
                  {busy ? "Accepting…" : "Confirm Accept"}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">
              My Requests
            </div>
            <div className="mt-2 text-sm text-white/65">
              Manage sent and received learning requests.
            </div>
          </div>

          <div className="glass flex gap-2 p-2">
            <button
              type="button"
              className={tab === "sent" ? "btn-primary" : "btn-ghost"}
              onClick={() => setTab("sent")}
            >
              Sent
            </button>
            <button
              type="button"
              className={tab === "received" ? "btn-primary" : "btn-ghost"}
              onClick={() => setTab("received")}
            >
              Received
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm font-semibold text-cyan-100">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
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
            {items.map((r) => (
              <RequestCard
                key={r.id}
                kind={tab}
                r={r}
                onAccept={onAccept}
                onReject={onReject}
                busy={busy}
              />
            ))}
            {items.length === 0 ? (
              <div className="glass p-6 text-sm font-semibold text-white/70 md:col-span-2">
                No requests yet.
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
