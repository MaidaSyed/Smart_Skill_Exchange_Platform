import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, useSearchParams } from "react-router-dom";
import useAuth from "../context/useAuth.js";
import {
  adminDeleteSkill,
  adminDeleteUser,
  adminMergeSkills,
  adminSetUserRole,
  adminSetUserSuspended,
  getAdminDuplicateSkills,
  getAdminReports,
  getAdminSessions,
  getAdminSkills,
  getAdminStats,
  getAdminUsers,
} from "../services/api.js";
import { formatDateLocal, formatDateTimeLocal, formatTimeOfDay } from "../utils/datetime.js";

const Motion = motion;

function tile(label, value, tone = "white") {
  const color =
    tone === "cyan"
      ? "text-cyan-200"
      : tone === "emerald"
        ? "text-emerald-200"
        : tone === "amber"
          ? "text-amber-100"
          : "text-white";
  return (
    <div className="glass p-6">
      <div className="text-xs font-bold text-white/60">{label}</div>
      <div className={["mt-2 text-3xl font-extrabold tracking-tight", color].join(" ")}>
        {value}
      </div>
    </div>
  );
}

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, role, loading: authLoading } = useAuth();
  const userId = currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userDetails, setUserDetails] = useState(null);

  const [skills, setSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [duplicates, setDuplicates] = useState([]);
  const [keepByKey, setKeepByKey] = useState({});

  const [sessions, setSessions] = useState([]);
  const [sessionFilter, setSessionFilter] = useState("");

  const [reports, setReports] = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const tab = useMemo(() => {
    const t = String(searchParams.get("tab") || "").trim().toLowerCase();
    const allowed = new Set(["dashboard", "users", "skills", "sessions", "reports"]);
    return allowed.has(t) ? t : "dashboard";
  }, [searchParams]);

  const loadDashboard = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getAdminStats(userId)
      .then((s) => setStats(s))
      .catch((e) => setError(e?.message || "Failed to load admin stats"))
      .finally(() => setLoading(false));
  }, [userId]);

  const loadUsers = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getAdminUsers(userId, { search: userSearch || undefined, limit: 100 })
      .then((u) => setUsers(u))
      .catch((e) => setError(e?.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [userId, userSearch]);

  const loadSkills = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getAdminSkills(userId, { search: skillSearch || undefined, limit: 200 })
      .then((s) => setSkills(s))
      .catch((e) => setError(e?.message || "Failed to load skills"))
      .finally(() => setLoading(false));
  }, [userId, skillSearch]);

  const loadDuplicates = useCallback(() => {
    if (!userId) return;
    getAdminDuplicateSkills(userId)
      .then((d) => setDuplicates(d))
      .catch(() => setDuplicates([]));
  }, [userId]);

  const loadSessions = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getAdminSessions(userId, { filter: sessionFilter || undefined, limit: 200 })
      .then((s) => setSessions(s))
      .catch((e) => setError(e?.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
  }, [userId, sessionFilter]);

  const loadReports = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    getAdminReports(userId, { limit: 10 })
      .then((r) => setReports(r))
      .catch((e) => setError(e?.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  }, [userId]);

  const goTab = useCallback(
    (nextTab) => {
      const t = String(nextTab || "").trim().toLowerCase();
      const allowed = new Set(["dashboard", "users", "skills", "sessions", "reports"]);
      if (!allowed.has(t) || t === "dashboard") {
        setSearchParams({});
        return;
      }
      setSearchParams({ tab: t });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!userId) return;
      if (tab === "dashboard") loadDashboard();
      if (tab === "users") loadUsers();
      if (tab === "skills") {
        loadSkills();
        loadDuplicates();
      }
      if (tab === "sessions") loadSessions();
      if (tab === "reports") loadReports();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadDashboard, loadDuplicates, loadReports, loadSessions, loadSkills, loadUsers, tab, userId]);

  const confirmAction = () => {
    if (!confirm || !userId) return;
    setBusy(true);
    setError("");

    const run = async () => {
      if (confirm.kind === "role") {
        await adminSetUserRole(userId, confirm.userId, confirm.role);
        await loadUsers();
        return;
      }
      if (confirm.kind === "status") {
        await adminSetUserSuspended(userId, confirm.userId, confirm.suspended);
        await loadUsers();
        return;
      }
      if (confirm.kind === "deleteUser") {
        await adminDeleteUser(userId, confirm.userId);
        await loadUsers();
        return;
      }
      if (confirm.kind === "deleteSkill") {
        await adminDeleteSkill(userId, confirm.skillId);
        await loadSkills();
        return;
      }
      if (confirm.kind === "mergeSkills") {
        await adminMergeSkills(userId, { fromSkillId: confirm.fromSkillId, toSkillId: confirm.toSkillId });
        await loadSkills();
        await loadDuplicates();
      }
      if (confirm.kind === "mergeDuplicateGroup") {
        for (const fromSkillId of confirm.fromSkillIds || []) {
          if (!fromSkillId || fromSkillId === confirm.toSkillId) continue;
          await adminMergeSkills(userId, { fromSkillId, toSkillId: confirm.toSkillId });
        }
        await loadSkills();
        await loadDuplicates();
      }
    };

    run()
      .then(() => setConfirm(null))
      .catch((e) => setError(e?.message || "Action failed"))
      .finally(() => setBusy(false));
  };

  const sections = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard" },
      { id: "users", label: "Users" },
      { id: "skills", label: "Skills" },
      { id: "sessions", label: "Sessions" },
      { id: "reports", label: "Reports" },
    ],
    [],
  );

  if (authLoading) return null;
  if (role !== "admin") return <Navigate to="/home" replace />;

  return (
    <div className="container-app py-12 sm:py-16">
      <AnimatePresence>
        {confirm ? (
          <motion.div
            className="fixed inset-0 z-[90] grid place-items-center px-4 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setConfirm(null)} aria-label="Close" />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="glass relative w-full max-w-lg p-7 sm:p-8"
            >
              <div className="text-lg font-extrabold text-white">Confirm action</div>
              <div className="mt-2 text-sm text-white/70">{confirm.text}</div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" className="btn-secondary" onClick={() => setConfirm(null)} disabled={busy}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={confirmAction} disabled={busy}>
                  {busy ? "Working…" : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">Admin</div>
            <div className="mt-2 text-sm text-white/65">Manage the platform with SQL-powered analytics.</div>
          </div>
        </div>

        <div className="mt-6 glass flex flex-wrap gap-2 p-2">
          {sections.map((s) => (
            <button key={s.id} type="button" className={tab === s.id ? "btn-primary" : "btn-ghost"} onClick={() => goTab(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>
        ) : null}

        {tab === "dashboard" ? (
          loading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tile("Total Users", stats?.total_users ?? 0, "cyan")}
              {tile("Total Skills Added", stats?.total_skills_added ?? 0)}
              {tile("Total Requests", stats?.total_requests ?? 0)}
              {tile("Total Accepted Sessions", stats?.total_accepted_sessions ?? 0, "emerald")}
              {tile("Total Credits Circulated", stats?.total_credits_circulated ?? 0, "amber")}
              {tile("Active Users This Week", stats?.active_users_this_week ?? 0)}
            </div>
          )
        ) : null}

        {tab === "users" ? (
          <div className="mt-8">
            <div className="glass p-4">
              <input className="input" placeholder="Search users…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="mt-4 glass overflow-hidden">
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr className="text-xs font-extrabold uppercase tracking-wide text-white/60">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Credits</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-4" colSpan={7}>
                            <div className="h-10 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : users.length ? (
                      users.map((u) => (
                        <tr key={u.user_id} className="text-sm text-white/80">
                          {(() => {
                            const isSelf = String(u.user_id) === String(userId);
                            const selfMsg = "You cannot perform this action on your own account.";
                            return (
                              <>
                          <td className="px-4 py-4 font-extrabold text-white">{u.full_name || "—"}</td>
                          <td className="px-4 py-4">{u.email || "—"}</td>
                          <td className="px-4 py-4">{u.role}</td>
                          <td className="px-4 py-4">{u.credits}</td>
                          <td className="px-4 py-4">{u.is_suspended ? "Suspended" : "Active"}</td>
                          <td className="px-4 py-4">{formatDateTimeLocal(u.joined_at)}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" className="btn-secondary" onClick={() => setUserDetails(u)}>
                                Details
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={isSelf}
                                title={isSelf ? selfMsg : undefined}
                                onClick={() =>
                                  setConfirm({
                                    kind: "role",
                                    userId: u.user_id,
                                    role: u.role === "admin" ? "user" : "admin",
                                    text: u.role === "admin" ? "Demote this user to user?" : "Promote this user to admin?",
                                  })
                                }
                              >
                                {u.role === "admin" ? "Demote" : "Promote"}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={isSelf}
                                title={isSelf ? selfMsg : undefined}
                                onClick={() =>
                                  setConfirm({
                                    kind: "status",
                                    userId: u.user_id,
                                    suspended: !u.is_suspended,
                                    text: u.is_suspended ? "Activate this user?" : "Suspend this user?",
                                  })
                                }
                              >
                                {u.is_suspended ? "Activate" : "Suspend"}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={isSelf}
                                title={isSelf ? selfMsg : undefined}
                                onClick={() =>
                                  setConfirm({
                                    kind: "deleteUser",
                                    userId: u.user_id,
                                    text: "Delete this user and all related records? This cannot be undone.",
                                  })
                                }
                              >
                                Delete
                              </button>
                            </div>
                            {isSelf ? (
                              <div className="mt-2 text-xs font-semibold text-white/55">
                                {selfMsg}
                              </div>
                            ) : null}
                          </td>
                              </>
                            );
                          })()}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-sm font-semibold text-white/65" colSpan={7}>
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "skills" ? (
          <div className="mt-8">
            <div className="glass p-4">
              <input className="input" placeholder="Search skills…" value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="glass p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-white">Manage duplicate skills</div>
                  <button type="button" className="btn-ghost" onClick={loadDuplicates}>
                    Refresh
                  </button>
                </div>
                <div className="mt-1 text-xs font-semibold text-white/55">Duplicates are grouped by case-insensitive skill name.</div>

                <div className="mt-4 space-y-3">
                  {duplicates.length ? (
                    duplicates.slice(0, 8).map((g) => {
                      const key = g.key;
                      const ids = Array.isArray(g.ids) ? g.ids : [];
                      const names = Array.isArray(g.names) ? g.names : [];
                      const keepIdRaw = keepByKey[key] ?? ids[0] ?? null;
                      const keepId = keepIdRaw ? Number(keepIdRaw) : null;
                      const mergeFromIds = ids.filter((id) => Number(id) !== keepId).map((id) => Number(id));

                      return (
                        <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm font-extrabold text-white">
                              {key} <span className="text-white/55">({g.count})</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-xs font-bold text-white/55">Keep</div>
                              <select
                                className="input !py-2 !text-sm"
                                value={keepId || ""}
                                onChange={(e) =>
                                  setKeepByKey((prev) => ({
                                    ...prev,
                                    [key]: e.target.value ? Number(e.target.value) : null,
                                  }))
                                }
                              >
                                {ids.map((id, idx) => (
                                  <option key={id} value={id}>
                                    #{id} · {names[idx] || key}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={!keepId || mergeFromIds.length < 1}
                                onClick={() =>
                                  setConfirm({
                                    kind: "mergeDuplicateGroup",
                                    toSkillId: keepId,
                                    fromSkillIds: mergeFromIds,
                                    text: `Merge ${mergeFromIds.length} duplicate skill(s) into #${keepId}? This moves all links/requests and deletes the merged skill records.`,
                                  })
                                }
                              >
                                Merge
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {ids.map((id, idx) => (
                              <div
                                key={id}
                                className={[
                                  "rounded-full border px-3 py-1 text-xs font-extrabold",
                                  Number(id) === keepId ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-white/75",
                                ].join(" ")}
                              >
                                #{id} · {names[idx] || key}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/65">
                      No duplicates detected.
                    </div>
                  )}
                </div>
              </div>
              <div className="glass p-6">
                <div className="text-sm font-extrabold text-white">Most popular skills</div>
                <div className="mt-4 space-y-2">
                  {(skills || []).slice(0, 8).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-white">
                          #{s.id} · {s.name}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-white/55">
                          Users: {s.users_count} · Requests: {s.requests_count}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          setConfirm({
                            kind: "deleteSkill",
                            skillId: s.id,
                            text: "Remove this skill? This will also remove user-skill links due to cascade.",
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 glass overflow-hidden">
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr className="text-xs font-extrabold uppercase tracking-wide text-white/60">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Users</th>
                      <th className="px-4 py-3">Requests</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-4" colSpan={7}>
                            <div className="h-10 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : skills.length ? (
                      skills.map((s) => (
                        <tr key={s.id} className="text-sm text-white/80">
                          <td className="px-4 py-4 font-extrabold text-white">{s.id}</td>
                          <td className="px-4 py-4">{s.name}</td>
                          <td className="px-4 py-4">{s.category || "—"}</td>
                          <td className="px-4 py-4">{s.skill_type || "—"}</td>
                          <td className="px-4 py-4">{s.users_count}</td>
                          <td className="px-4 py-4">{s.requests_count}</td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() =>
                                setConfirm({
                                  kind: "deleteSkill",
                                  skillId: s.id,
                                  text: "Remove this skill? This will also remove user-skill links due to cascade.",
                                })
                              }
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-sm font-semibold text-white/65" colSpan={7}>
                          No skills found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "sessions" ? (
          <div className="mt-8">
            <div className="glass flex flex-wrap gap-2 p-2">
              {[
                { id: "", label: "All" },
                { id: "upcoming", label: "Upcoming" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ].map((f) => (
                <button key={f.id} type="button" className={sessionFilter === f.id ? "btn-primary" : "btn-ghost"} onClick={() => setSessionFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mt-4 glass overflow-hidden">
              <div className="overflow-auto">
                <table className="min-w-[1100px] w-full text-left">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr className="text-xs font-extrabold uppercase tracking-wide text-white/60">
                      <th className="px-4 py-3">Skill</th>
                      <th className="px-4 py-3">Learner</th>
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Exchange</th>
                      <th className="px-4 py-3">Chat Expires</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-4" colSpan={9}>
                            <div className="h-10 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : sessions.length ? (
                      sessions.map((s) => (
                        <tr key={s.id} className="text-sm text-white/80">
                          <td className="px-4 py-4 font-extrabold text-white">{s.skill_name}</td>
                          <td className="px-4 py-4">{s.learner_name}</td>
                          <td className="px-4 py-4">{s.teacher_name}</td>
                          <td className="px-4 py-4">{formatDateLocal(s.scheduled_date)}</td>
                          <td className="px-4 py-4">
                            {formatTimeOfDay(s.start_time)} - {formatTimeOfDay(s.end_time)}
                          </td>
                          <td className="px-4 py-4">{s.duration_minutes || 60} min</td>
                          <td className="px-4 py-4">
                            {s.exchange_type === "credits"
                              ? `${s.offered_credit_amount || 0} credits`
                              : "skill exchange"}
                          </td>
                          <td className="px-4 py-4">{formatDateTimeLocal(s.chat_expires_at)}</td>
                          <td className="px-4 py-4">{s.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-sm font-semibold text-white/65" colSpan={9}>
                          No sessions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "reports" ? (
          loading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass h-44 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="glass p-6">
                <div className="text-sm font-extrabold text-white">Most active teachers</div>
                <div className="mt-4 grid gap-2">
                  {(reports?.activeTeachers || []).map((r) => (
                    <div key={r.teacher_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                      <div className="font-extrabold text-white">{r.name}</div>
                      <div className="text-xs font-bold text-white/60">{r.sessions_count} sessions</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass p-6">
                <div className="text-sm font-extrabold text-white">Highest rated users</div>
                <div className="mt-4 grid gap-2">
                  {(reports?.topRated || []).map((r) => (
                    <div key={r.user_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                      <div className="font-extrabold text-white">{r.name}</div>
                      <div className="text-xs font-bold text-white/60">
                        {Number(r.avg_rating || 0).toFixed(2)} ★ · {r.reviews_count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass p-6">
                <div className="text-sm font-extrabold text-white">Top earning users</div>
                <div className="mt-4 grid gap-2">
                  {(reports?.topEarners || []).map((r) => (
                    <div key={r.user_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                      <div className="font-extrabold text-white">{r.name}</div>
                      <div className="text-xs font-bold text-white/60">{r.credits_earned} credits</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass p-6">
                <div className="text-sm font-extrabold text-white">Most requested skills</div>
                <div className="mt-4 grid gap-2">
                  {(reports?.mostRequested || []).map((r) => (
                    <div key={r.skill_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                      <div className="font-extrabold text-white">{r.name}</div>
                      <div className="text-xs font-bold text-white/60">{r.requests_count} requests</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : null}
      </Motion.div>

      <AnimatePresence>
        {userDetails ? (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/50 px-4 py-10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 bg-transparent" onClick={() => setUserDetails(null)} aria-label="Close" />
            <motion.div
              className="glass relative w-full max-w-2xl p-6"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-extrabold text-white">User Details</div>
                  <div className="mt-1 text-sm font-semibold text-white/60">{userDetails.email || "—"}</div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setUserDetails(null)}>
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-white/60">Name</div>
                  <div className="mt-1 text-sm font-extrabold text-white">{userDetails.full_name || "—"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-white/60">User ID</div>
                  <div className="mt-1 break-all text-sm font-extrabold text-white">{userDetails.user_id || "—"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-white/60">Role</div>
                  <div className="mt-1 text-sm font-extrabold text-white">{userDetails.role || "user"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-white/60">Status</div>
                  <div className="mt-1 text-sm font-extrabold text-white">{userDetails.is_suspended ? "Suspended" : "Active"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-white/60">Credits</div>
                  <div className="mt-1 text-sm font-extrabold text-white">{Number(userDetails.credits || 0)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-white/60">Joined</div>
                  <div className="mt-1 text-sm font-extrabold text-white">
                    {userDetails.joined_at ? formatDateTimeLocal(userDetails.joined_at) : "—"}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
