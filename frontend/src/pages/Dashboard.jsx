import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import useAuth from "../context/useAuth.js";

const Motion = motion;

function Card({ title, desc }) {
  return (
    <div className="glass p-6">
      <div className="text-lg font-extrabold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/70">{desc}</div>
      <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mt-4 text-sm font-semibold text-white/70">
        Explore{" "}
        <span className="inline-block transition group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, role, profile, skills } = useAuth();
  const fullName =
    profile?.full_name ||
    currentUser?.name ||
    currentUser?.email?.split("@")?.[0] ||
    "User";
  const skillCount = skills?.length || 0;

  return (
    <div className="container-app py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-3xl"
      >
        <div className="glass p-7 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-extrabold text-white">Welcome, {fullName}</div>
              <div className="mt-1 text-sm text-white/65">
                Signed in as{" "}
                <span className="font-bold text-white">
                  {currentUser?.email || "—"}
                </span>
              </div>
              <div className="mt-1 text-sm text-white/65">
                Role:{" "}
                <span className="font-bold text-cyan-200">
                  {role || "unknown"}
                </span>
              </div>
              <div className="mt-1 text-sm text-white/65">
                Skills: <span className="font-bold text-white">{skillCount}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/profile" className="btn-secondary">
                View Profile
              </Link>
              <Link to="/edit-profile" className="btn-primary">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {skillCount < 1 ? (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-6 py-5 text-sm font-semibold text-cyan-100">
            Add at least one skill to explore others. Go to{" "}
            <Link className="font-extrabold underline" to="/edit-profile">
              Edit Profile
            </Link>{" "}
            and add your first skill.
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {role === "admin" ? (
            <Card
              title="Admin Panel"
              desc="Manage users, review activity, and control the platform settings."
            />
          ) : (
            <Card
              title="User Dashboard"
              desc="Discover matches, manage your skills, and start exchanging knowledge."
            />
          )}

          <div className="glass p-6">
            <div className="text-lg font-extrabold text-white">
              Quick Actions
            </div>
            <div className="mt-5 grid gap-3">
              <Link to="/profile" className="btn-secondary w-full">
                View Profile
              </Link>
              <Link to="/edit-profile" className="btn-secondary w-full">
                Manage Skills
              </Link>
              <Link
                to="/explore-skills"
                className={[
                  "w-full",
                  skillCount < 1 ? "pointer-events-none opacity-50" : "",
                  "btn-secondary",
                ].join(" ")}
              >
                Explore Skills
              </Link>
              <Link to="/messages" className="btn-secondary w-full">
                Messages
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
