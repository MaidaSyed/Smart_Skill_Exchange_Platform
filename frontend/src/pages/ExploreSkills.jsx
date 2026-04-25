import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { exploreSkills } from "../services/api.js";
import RequestSessionModal from "../components/RequestSessionModal.jsx";
import useAuth from "../context/useAuth.js";

const Motion = motion;

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function ExploreSkills() {
  const { currentUser } = useAuth();
  const [category, setCategory] = useState("");
  const [skillType, setSkillType] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      setLoading(true);
      setError("");

      exploreSkills({
        category: category || undefined,
        skillType: skillType || undefined,
        proficiency: proficiency || undefined,
        sort: sort || undefined,
        search: search.trim() || undefined,
      })
        .then((rows) => {
          if (cancelled) return;
          setResults(rows);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e?.message || "Failed to load explore list");
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [category, proficiency, search, skillType, sort]);

  const categories = useMemo(() => {
    const set = new Set(results.map((r) => r.category).filter(Boolean));
    return Array.from(set).sort();
  }, [results]);

  const types = useMemo(() => {
    const set = new Set(results.map((r) => r.skill_type).filter(Boolean));
    return Array.from(set).sort();
  }, [results]);

  return (
    <div className="container-app py-12 sm:py-16">
      <RequestSessionModal
        open={Boolean(selected)}
        teacher={selected}
        onClose={() => setSelected(null)}
      />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">
              Explore Teachers
            </div>
            <div className="mt-2 text-sm text-white/65">
              Discover people with real skills and request a session.
            </div>
            <div className="mt-5 max-w-xl">
              <input
                className="input"
                placeholder="Search by skill or teacher name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="glass grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs font-bold text-white/60">Category</div>
              <select
                className="input mt-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-bold text-white/60">Skill Type</div>
              <select
                className="input mt-2"
                value={skillType}
                onChange={(e) => setSkillType(e.target.value)}
              >
                <option value="">All</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-bold text-white/60">Proficiency</div>
              <select
                className="input mt-2"
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value)}
              >
                <option value="">All</option>
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    Level {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-bold text-white/60">Sort</div>
              <select
                className="input mt-2"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="rated">Highest rated</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass h-44 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((r, idx) => (
              <motion.div
                key={`${r.teacher_id}-${r.user_skill_id}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.02 }}
                className="glass p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/40 to-cyan-400/25 text-sm font-extrabold text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                      {initials(r.full_name)}
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-white">
                        {r.full_name || "Anonymous"}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-white/55">
                        {r.role || "user"}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/75">
                    L{r.proficiency}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-sm font-extrabold text-white">{r.skill_name}</div>
                  <div className="mt-1 text-xs font-semibold text-white/60">
                    {r.category || "Uncategorized"} · {r.skill_type || "General"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/70">
                  {typeof r.teachers_per_skill === "number" ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {r.teachers_per_skill} teachers for this skill
                    </span>
                  ) : null}
                  {typeof r.avg_rating === "number" ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {r.avg_rating.toFixed(1)} ★ · {r.reviews_count || 0} reviews
                    </span>
                  ) : null}
                  {typeof r.requests_count === "number" ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {r.requests_count} requests
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 text-sm leading-relaxed text-white/70">
                  {r.bio
                    ? r.bio
                    : "No bio yet. Open a request and ask what they can teach and how they prefer to exchange skills."}
                </div>

                {currentUser?.id && currentUser.id === r.teacher_id ? (
                  <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100">
                    You cannot request yourself.
                  </div>
                ) : (
                <button
                  type="button"
                  className="btn-secondary mt-6 w-full"
                  onClick={() => setSelected(r)}
                >
                  Request session
                </button>
                )}
              </motion.div>
            ))}

            {results.length === 0 ? (
              <div className="glass p-6 text-sm font-semibold text-white/70 md:col-span-2 lg:col-span-3">
                No results found.
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
