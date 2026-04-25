import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth.js";

const Motion = motion;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    login({
      email: form.email,
      password: form.password,
      rememberMe: form.remember,
    })
      .then(() => {
        const next = location.state?.from || "/home";
        navigate(next, { replace: true });
      })
      .catch((err) => {
        setError(err?.message || "Login failed. Please try again.");
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
              Welcome back
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
              Login
            </h1>
            <p className="mt-2 text-sm text-white/65">
              Access your account and continue learning.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white/70">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-300 focus:ring-cyan-300/30"
                  checked={form.remember}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, remember: e.target.checked }))
                  }
                />
                Remember me
              </label>
              <span className="text-sm font-semibold text-white/50">
                Forgot password?
              </span>
            </div>

            <button type="submit" className="btn-primary w-full">
              {submitting ? "Signing in…" : "Login"}
            </button>
          </form>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 text-center text-sm text-white/65">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-extrabold text-cyan-200">
              Sign up
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-indigo-500/12 blur-3xl"
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
