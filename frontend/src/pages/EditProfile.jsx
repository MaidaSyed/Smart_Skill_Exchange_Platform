import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import useAuth from "../context/useAuth.js";
import { addUserSkill, removeUserSkill, updateProfile } from "../services/api.js";

const Motion = motion;

function initialName(profile, user) {
  return profile?.full_name || user?.name || "";
}

export default function EditProfile() {
  const { currentUser, profile, skills, refreshUserData } = useAuth();
  const userId = currentUser?.id;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => ({
    fullName: initialName(profile, currentUser),
    bio: profile?.bio || "",
  }));

  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "",
    skillType: "",
    proficiency: 3,
  });
  const [skillBusy, setSkillBusy] = useState(false);

  const canSave = useMemo(() => Boolean(userId), [userId]);

  const onSaveProfile = (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError("");
    setMessage("");

    updateProfile(userId, { fullName: form.fullName, bio: form.bio })
      .then(() => refreshUserData(userId))
      .then(() => setMessage("Profile updated"))
      .catch((err) => setError(err?.message || "Failed to update profile"))
      .finally(() => setSaving(false));
  };

  const onAddSkill = (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!skillForm.name.trim()) return;

    setSkillBusy(true);
    setError("");
    setMessage("");

    addUserSkill(userId, {
      name: skillForm.name.trim(),
      category: skillForm.category.trim() || null,
      skillType: skillForm.skillType.trim() || null,
      proficiency: Number(skillForm.proficiency) || 3,
    })
      .then(() => refreshUserData(userId))
      .then(() => {
        setSkillForm({ name: "", category: "", skillType: "", proficiency: 3 });
        setMessage("Skill added");
      })
      .catch((err) => setError(err?.message || "Failed to add skill"))
      .finally(() => setSkillBusy(false));
  };

  const onRemoveSkill = (skillId) => {
    if (!userId) return;
    setSkillBusy(true);
    setError("");
    setMessage("");

    removeUserSkill(userId, skillId)
      .then(() => refreshUserData(userId))
      .then(() => setMessage("Skill removed"))
      .catch((err) => setError(err?.message || "Failed to remove skill"))
      .finally(() => setSkillBusy(false));
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-4xl"
      >
        <div className="glass p-7 sm:p-8">
          <div className="text-2xl font-extrabold tracking-tight text-white">
            Edit Profile
          </div>
          <div className="mt-2 text-sm text-white/65">
            Update your info and manage skills.
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm font-semibold text-cyan-100">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <form onSubmit={onSaveProfile} className="glass p-6">
              <div className="text-lg font-extrabold text-white">Profile</div>
              <div className="mt-5">
                <label className="label" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  className="input"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>

              <div className="mt-5">
                <label className="label" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  className="input min-h-[120px] resize-none"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Short bio about what you teach and what you want to learn…"
                />
              </div>

              <button
                type="submit"
                className="btn-primary mt-6 w-full"
                disabled={!canSave || saving}
              >
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </form>

            <div className="glass p-6">
              <div className="text-lg font-extrabold text-white">Skills</div>
              <form onSubmit={onAddSkill} className="mt-5 space-y-4">
                <div>
                  <label className="label" htmlFor="skillName">
                    Skill Name
                  </label>
                  <input
                    id="skillName"
                    className="input"
                    value={skillForm.name}
                    onChange={(e) =>
                      setSkillForm((s) => ({ ...s, name: e.target.value }))
                    }
                    placeholder="e.g. React, UI Design, English"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="category">
                      Category
                    </label>
                    <input
                      id="category"
                      className="input"
                      value={skillForm.category}
                      onChange={(e) =>
                        setSkillForm((s) => ({ ...s, category: e.target.value }))
                      }
                      placeholder="e.g. Tech"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="skillType">
                      Skill Type
                    </label>
                    <input
                      id="skillType"
                      className="input"
                      value={skillForm.skillType}
                      onChange={(e) =>
                        setSkillForm((s) => ({ ...s, skillType: e.target.value }))
                      }
                      placeholder="e.g. Development"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="proficiency">
                    Proficiency (1–5)
                  </label>
                  <input
                    id="proficiency"
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    value={skillForm.proficiency}
                    onChange={(e) =>
                      setSkillForm((s) => ({ ...s, proficiency: e.target.value }))
                    }
                  />
                </div>

                <button type="submit" className="btn-secondary w-full" disabled={skillBusy}>
                  {skillBusy ? "Working…" : "Add Skill"}
                </button>
              </form>

              <div className="mt-6">
                <div className="text-sm font-extrabold text-white/80">
                  Your skills
                </div>
                <div className="mt-3 space-y-2">
                  {skills?.length ? (
                    skills.map((s) => (
                      <div
                        key={`${s.skill_id}-${s.proficiency}`}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-extrabold text-white">
                            {s.name}
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-white/60">
                            {s.category || "Uncategorized"} · {s.skill_type || "General"} · L{s.proficiency}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => onRemoveSkill(s.skill_id)}
                          disabled={skillBusy}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm font-semibold text-white/65">
                      No skills yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

