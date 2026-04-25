import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useAuth from "../context/useAuth.js";
import { getNotifications, getNotificationsUnreadCount, markNotificationsSeen } from "../services/api.js";
import { formatDateTimeLocal } from "../utils/datetime.js";

const Motion = motion;

function badge(type) {
  if (type === "new_message") return "bg-indigo-500/15 text-indigo-200 border-indigo-500/20";
  if (type === "request_received") return "bg-cyan-400/10 text-cyan-100 border-cyan-400/20";
  if (type === "request_accepted") return "bg-emerald-500/15 text-emerald-200 border-emerald-500/20";
  if (type === "request_rejected") return "bg-rose-500/15 text-rose-200 border-rose-500/20";
  if (type === "credits_received") return "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/20";
  if (type === "new_review") return "bg-amber-400/15 text-amber-100 border-amber-400/20";
  return "bg-white/10 text-white/70 border-white/10";
}

export default function Notifications() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const unreadOnly = useMemo(() => tab === "unread", [tab]);

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    Promise.all([
      getNotifications(userId, { limit: 60, unreadOnly }),
      getNotificationsUnreadCount(userId),
    ])
      .then(([a, c]) => {
        setItems(a);
        setUnread(Number(c) || 0);
      })
      .catch((e) => setError(e?.message || "Failed to load notifications"))
      .finally(() => setLoading(false));
  }, [unreadOnly, userId]);

  useEffect(() => {
    const id = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (!userId) return () => {};
    const id = window.setInterval(() => load(), 6000);
    return () => window.clearInterval(id);
  }, [load, userId]);

  const markAll = () => {
    if (!userId) return;
    setBusy(true);
    setError("");
    markNotificationsSeen(userId)
      .then((r) => {
        setUnread(Number(r?.unreadCount) || 0);
        load();
      })
      .catch((e) => setError(e?.message || "Failed to mark as read"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <Motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">Notifications</div>
            <div className="mt-2 text-sm text-white/65">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="glass flex gap-2 p-2">
              <button
                type="button"
                className={tab === "all" ? "btn-primary" : "btn-ghost"}
                onClick={() => setTab("all")}
              >
                All
              </button>
              <button
                type="button"
                className={tab === "unread" ? "btn-primary" : "btn-ghost"}
                onClick={() => setTab("unread")}
              >
                Unread
              </button>
            </div>
            <button type="button" className="btn-secondary" onClick={markAll} disabled={busy || unread === 0}>
              Mark all as read
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {items.map((n) => (
              <div key={n.id} className="glass p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold text-white">{n.title}</div>
                    <div className="mt-1 text-sm text-white/70">{n.message}</div>
                    <div className="mt-2 text-xs font-semibold text-white/45">{formatDateTimeLocal(n.created_at)}</div>
                  </div>
                  <div className={["rounded-full border px-3 py-1 text-xs font-extrabold", badge(n.type)].join(" ")}>
                    {n.type}
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 ? (
              <div className="glass p-6 text-sm font-semibold text-white/70">
                No notifications.
              </div>
            ) : null}
          </div>
        )}
      </Motion.div>
    </div>
  );
}
