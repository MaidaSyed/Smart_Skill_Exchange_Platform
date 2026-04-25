import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useAuth from "../context/useAuth.js";
import { getConversations, getThread, markThreadRead, sendMessage } from "../services/api.js";
import { formatTimeLocal } from "../utils/datetime.js";

const Motion = motion;

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function Bubble({ mine, text, ts }) {
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          mine
            ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_16px_50px_rgba(99,102,241,0.18)]"
            : "border border-white/10 bg-white/5 text-white/85",
        ].join(" ")}
      >
        <div>{text}</div>
        <div className={mine ? "mt-2 text-[11px] font-semibold text-white/80" : "mt-2 text-[11px] font-semibold text-white/45"}>
          {formatTimeLocal(ts)}
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState("");
  const [blockedReason, setBlockedReason] = useState("");

  const active = useMemo(
    () => conversations.find((c) => String(c.other_user_id) === String(activeId)) || null,
    [activeId, conversations],
  );

  const loadConversations = useCallback(() => {
    if (!userId) return Promise.resolve();
    return getConversations(userId, { search: search.trim() || undefined, limit: 80 })
      .then((rows) => setConversations(rows))
      .catch((e) => setError(e?.message || "Failed to load conversations"));
  }, [search, userId]);

  const loadThread = useCallback(
    (otherUserId) => {
      if (!userId || !otherUserId) return Promise.resolve();
      setThreadLoading(true);
      return getThread(userId, otherUserId, { limit: 120 })
        .then((rows) => {
          setThread(rows.slice().reverse());
          setBlockedReason("");
          return markThreadRead(userId, otherUserId).catch(() => null);
        })
        .catch((e) => {
          if (e?.response?.status === 403) {
            setBlockedReason(e?.message || "Chat is closed.");
            setThread([]);
            return;
          }
          setBlockedReason("");
          setError(e?.message || "Failed to load messages");
        })
        .finally(() => setThreadLoading(false));
    },
    [userId],
  );

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError("");
      loadConversations()
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!userId) return () => {};
    const id = window.setInterval(() => {
      loadConversations();
      if (activeId) loadThread(activeId);
    }, 4500);
    return () => window.clearInterval(id);
  }, [activeId, loadConversations, loadThread, userId]);

  useEffect(() => {
    if (!activeId) return;
    const id = window.setTimeout(() => loadThread(activeId), 0);
    return () => window.clearTimeout(id);
  }, [activeId, loadThread]);

  const onSend = (e) => {
    e.preventDefault();
    if (!userId || !activeId) return;
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    setBlockedReason("");
    setDraft("");

    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_id: userId,
      receiver_id: activeId,
      message_text: text,
      created_at: new Date().toISOString(),
    };
    setThread((t) => t.concat([optimistic]));

    sendMessage({ senderId: userId, receiverId: activeId, messageText: text })
      .then(() => loadThread(activeId))
      .catch((e2) => {
        if (e2?.response?.status === 403) {
          setBlockedReason(e2?.message || "Chat is closed.");
          return;
        }
        setError(e2?.message || "Failed to send message");
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <Motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">Messages</div>
            <div className="mt-2 text-sm text-white/65">
              Chat is available only between users with a request or session history.
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="glass p-4">
            <input
              className="input"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-4 grid gap-2">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                ))
              ) : conversations.length ? (
                conversations.map((c) => (
                  <button
                    key={c.other_user_id}
                    type="button"
                    onClick={() => setActiveId(c.other_user_id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                      String(activeId) === String(c.other_user_id)
                        ? "border-cyan-400/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/35 to-cyan-400/20 text-sm font-extrabold text-white">
                      {initials(c.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-white">
                        {c.full_name}
                      </div>
                      <div className="truncate text-xs font-semibold text-white/55">
                        {c.last_message || "—"}
                      </div>
                    </div>
                    {c.unread_count > 0 ? (
                      <div className="rounded-full bg-rose-500/20 px-2 py-1 text-xs font-extrabold text-rose-200">
                        {c.unread_count}
                      </div>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white/70">
                  No conversations yet.
                </div>
              )}
            </div>
          </div>

          <div className="glass flex min-h-[520px] flex-col overflow-hidden">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm font-extrabold text-white">
                {active ? active.full_name : "Select a conversation"}
              </div>
              <div className="mt-1 text-xs font-semibold text-white/55">
                {active ? "Messages are synced automatically." : "Pick a user from the left to open chat."}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {threadLoading ? (
                <div className="text-sm font-semibold text-white/70">Loading…</div>
              ) : activeId ? (
                blockedReason ? (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm font-semibold text-amber-100">
                    {blockedReason}
                  </div>
                ) : thread.length ? (
                  thread.map((m) => (
                    <Bubble
                      key={m.id}
                      mine={String(m.sender_id) === String(userId)}
                      text={m.message_text}
                      ts={m.created_at}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white/70">
                    No messages yet. Say hello.
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white/70">
                  Choose a conversation to start chatting.
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <form onSubmit={onSend} className="flex gap-2">
                <input
                  className="input"
                  placeholder={
                    activeId
                      ? blockedReason
                        ? "Chat is closed"
                        : "Write a message…"
                      : "Select a conversation first"
                  }
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={!activeId || busy || Boolean(blockedReason)}
                />
                <button
                  type="submit"
                  className="btn-primary whitespace-nowrap"
                  disabled={!activeId || busy || !draft.trim() || Boolean(blockedReason)}
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}
