import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useAuth from "../context/useAuth.js";
import { getWalletSummary, getWalletTransactions } from "../services/api.js";
import { formatDateTimeLocal } from "../utils/datetime.js";

const Motion = motion;

function money(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return String(Math.trunc(x));
}

function pill(text) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
      {text}
    </span>
  );
}

export default function Wallet() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [tx, setTx] = useState([]);

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    Promise.all([
      getWalletSummary(userId),
      getWalletTransactions(userId, { type: type || undefined, limit: 50 }),
    ])
      .then(([s, t]) => {
        setSummary(s);
        setTx(t);
      })
      .catch((e) => setError(e?.message || "Failed to load wallet"))
      .finally(() => setLoading(false));
  }, [type, userId]);

  useEffect(() => {
    const id = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const totals = useMemo(() => {
    const credits = summary?.credits ?? 0;
    const earned = summary?.total_earned ?? 0;
    const spent = summary?.total_spent ?? 0;
    return { credits, earned, spent };
  }, [summary]);

  return (
    <div className="container-app py-12 sm:py-16">
      <Motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">
              Wallet
            </div>
            <div className="mt-2 text-sm text-white/65">
              Credits balance and transactions.
            </div>
          </div>

          <div className="glass grid gap-3 p-4 sm:grid-cols-3">
            <div>
              <div className="text-xs font-bold text-white/60">Balance</div>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {money(totals.credits)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/60">Total earned</div>
              <div className="mt-2 text-2xl font-extrabold text-emerald-200">
                {money(totals.earned)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/60">Total spent</div>
              <div className="mt-2 text-2xl font-extrabold text-rose-200">
                {money(totals.spent)}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-extrabold text-white">Recent transactions</div>
          <div className="glass flex gap-2 p-2">
            <button type="button" className={!type ? "btn-primary" : "btn-ghost"} onClick={() => setType("")}>
              All
            </button>
            {["earn", "spend", "signup_bonus", "skill_bonus", "refund", "transfer"].map((t) => (
              <button
                key={t}
                type="button"
                className={type === t ? "btn-primary" : "btn-ghost"}
                onClick={() => setType(t)}
              >
                {t === "signup_bonus" ? "Signup bonus" : t === "skill_bonus" ? "Skill bonus" : t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {tx.map((t) => (
              <div key={t.id} className="glass p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold text-white">
                      {t.transaction_type}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      Amount: {money(t.amount)} credits
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {t.request_id ? pill(`Request #${t.request_id}`) : null}
                      {t.session_id ? pill(`Session #${t.session_id}`) : null}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-white/45">{formatDateTimeLocal(t.created_at)}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/80">
                    {t.transaction_type === "spend" ? `-${money(t.amount)}` : `+${money(t.amount)}`}
                  </div>
                </div>
              </div>
            ))}

            {tx.length === 0 ? (
              <div className="glass p-6 text-sm font-semibold text-white/70">
                No transactions yet.
              </div>
            ) : null}
          </div>
        )}
      </Motion.div>
    </div>
  );
}
