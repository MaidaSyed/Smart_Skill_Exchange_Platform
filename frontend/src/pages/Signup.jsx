import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth.js";

const Motion = motion;

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const passwordMismatch = useMemo(() => {
    if (!submitted) return false;
    return form.password !== form.confirmPassword;
  }, [form.confirmPassword, form.password, submitted]);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (form.password !== form.confirmPassword) return;
    if (form.password.length < 6) return;

    setSubmitting(true);
    signup({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
    })
      .then(() => {
        navigate("/home", { replace: true });
      })
      .catch((err) => {
        setError(err?.message || "Sign up failed. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="relative">
      <div className="container-app grid min-h-[calc(100vh-64px)] place-items-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass w-full max-w-md p-7 sm:p-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Create your account
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
              Sign Up
            </h1>
            <p className="mt-2 text-sm text-white/65">
              Join the premium community and start exchanging skills.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                className="input"
                placeholder="Your name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={[
                  "input",
                  passwordMismatch ? "border-rose-300 focus:border-rose-400" : "",
                ].join(" ")}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                required
                minLength={6}
              />
              {passwordMismatch ? (
                <div className="mt-2 text-sm font-semibold text-rose-300">
                  Passwords do not match.
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create Account"}
            </button>
          </form>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 text-center text-sm text-white/65">
            Already have an account?{" "}
            <Link to="/login" className="font-extrabold text-cyan-200">
              Login
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/12 blur-3xl"
        animate={{ y: [0, 18, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl"
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
