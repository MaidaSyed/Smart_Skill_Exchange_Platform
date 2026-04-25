import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth.js";
import { createLearningRequest } from "../services/api.js";
import { formatDateInputValue } from "../utils/datetime.js";

const Motion = motion;

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function RequestSessionModal({ open, onClose, teacher }) {
  const navigate = useNavigate();
  const { currentUser, skills } = useAuth();

  const [nowMs, setNowMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    message: "",
    preferredDate: "",
    preferredStartTime: "",
    durationMinutes: 60,
    exchangeType: "skill",
    offeredSkillId: "",
    offeredCreditAmount: "",
  });

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setNowMs(Date.now()), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const minDate = nowMs ? formatDateInputValue(nowMs) : undefined;
  const minTime = (() => {
    if (!nowMs || !form.preferredDate || !minDate) return undefined;
    if (form.preferredDate !== minDate) return undefined;
    const d = new Date(nowMs);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  })();

  const futureOk = (() => {
    if (!nowMs || !form.preferredDate || !form.preferredStartTime) return false;
    const dt = new Date(`${form.preferredDate}T${form.preferredStartTime}`);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() > nowMs;
  })();

  const canSubmit = (() => {
    const isSelf = Boolean(currentUser?.id && teacher?.teacher_id && currentUser.id === teacher.teacher_id);
    const exchangeType = String(form.exchangeType || "").toLowerCase();
    const okExchange = exchangeType === "skill" || exchangeType === "credits";
    const okOffered =
      exchangeType === "skill"
        ? Boolean(form.offeredSkillId)
        : exchangeType === "credits"
          ? Number(form.offeredCreditAmount) > 0
          : false;

    return Boolean(
      currentUser?.id &&
        teacher?.teacher_id &&
        teacher?.user_skill_id &&
        form.preferredDate &&
        form.preferredStartTime &&
        futureOk &&
        Number(form.durationMinutes) &&
        !isSelf &&
        okExchange &&
        okOffered,
    );
  })();

  const close = () => {
    setError("");
    onClose();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    createLearningRequest({
      learnerId: currentUser.id,
      teacherId: teacher.teacher_id,
      userSkillId: teacher.user_skill_id,
      message: form.message,
      preferredDate: form.preferredDate,
      preferredStartTime: form.preferredStartTime,
      durationMinutes: Number(form.durationMinutes),
      exchangeType: form.exchangeType,
      offeredSkillId: form.exchangeType === "skill" ? Number(form.offeredSkillId) : null,
      offeredCreditAmount: form.exchangeType === "credits" ? Number(form.offeredCreditAmount) : null,
    })
      .then(() => {
        close();
        navigate("/my-requests", { replace: false });
      })
      .catch((err) => setError(err?.message || "Failed to send request"))
      .finally(() => setSubmitting(false));
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex justify-center overflow-y-auto px-4 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={close}
            aria-label="Close"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="glass relative my-auto w-full max-w-xl max-h-[85vh] overflow-y-auto p-7 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/40 to-cyan-400/25 text-sm font-extrabold text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                  {initials(teacher?.full_name)}
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">
                    Request Session
                  </div>
                  <div className="mt-1 text-sm text-white/65">
                    {teacher?.full_name || "Teacher"} · {teacher?.skill_name || "Skill"}
                  </div>
                </div>
              </div>

              <button type="button" className="btn-ghost" onClick={close}>
                Close
              </button>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
                {error}
              </div>
            ) : null}
            {form.preferredDate && form.preferredStartTime && !futureOk ? (
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm font-semibold text-amber-100">
                Choose a future date and time.
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {currentUser?.id && teacher?.teacher_id && currentUser.id === teacher.teacher_id ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm font-semibold text-amber-100">
                  You cannot request yourself.
                </div>
              ) : null}
              <div>
                <label className="label" htmlFor="message">
                  Message to teacher
                </label>
                <textarea
                  id="message"
                  className="input min-h-[120px] resize-none"
                  placeholder="Explain what you want to learn and your goals…"
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="preferredDate">
                    Preferred date
                  </label>
                  <input
                    id="preferredDate"
                    type="date"
                    className="input"
                    value={form.preferredDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, preferredDate: e.target.value }))
                    }
                    min={minDate}
                    required
                  />
                </div>

                <div>
                  <label className="label" htmlFor="preferredStartTime">
                    Preferred time
                  </label>
                  <input
                    id="preferredStartTime"
                    type="time"
                    className="input"
                    value={form.preferredStartTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, preferredStartTime: e.target.value }))
                    }
                    min={minTime || undefined}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="duration">
                  Duration
                </label>
                <select
                  id="duration"
                  className="input"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                  }
                >
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>

              <div className="glass border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-white/60">Exchange type</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className={form.exchangeType === "skill" ? "btn-primary" : "btn-secondary"}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        exchangeType: "skill",
                        offeredCreditAmount: "",
                      }))
                    }
                  >
                    Skill Exchange
                  </button>
                  <button
                    type="button"
                    className={form.exchangeType === "credits" ? "btn-primary" : "btn-secondary"}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        exchangeType: "credits",
                        offeredSkillId: "",
                      }))
                    }
                  >
                    Credit Exchange
                  </button>
                </div>

                {form.exchangeType === "skill" ? (
                  <div className="mt-4">
                    <label className="label" htmlFor="offeredSkill">
                      Skill you will teach in return
                    </label>
                    <select
                      id="offeredSkill"
                      className="input"
                      value={form.offeredSkillId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, offeredSkillId: e.target.value }))
                      }
                      required
                    >
                      <option value="">Select one of your skills…</option>
                      {Array.isArray(skills) && skills.length ? (
                        skills.map((s) => (
                          <option key={`${s.skill_id}-${s.id}`} value={s.skill_id}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          Add skills in your profile first
                        </option>
                      )}
                    </select>
                    <div className="mt-2 text-xs font-semibold text-white/55">
                      You can only offer a skill you already added to your profile.
                    </div>
                  </div>
                ) : null}

                {form.exchangeType === "credits" ? (
                  <div className="mt-4">
                    <label className="label" htmlFor="offeredCredits">
                      Credit amount
                    </label>
                    <input
                      id="offeredCredits"
                      className="input"
                      inputMode="numeric"
                      value={form.offeredCreditAmount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, offeredCreditAmount: e.target.value }))
                      }
                      placeholder="e.g. 20"
                      required
                    />
                    <div className="mt-2 text-xs font-semibold text-white/55">
                      {Number(form.offeredCreditAmount) > 0
                        ? `This session costs ${Number(form.offeredCreditAmount)} credits.`
                        : "Enter how many credits you will pay for this session."}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={close}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? "Sending…" : "Send Request"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
