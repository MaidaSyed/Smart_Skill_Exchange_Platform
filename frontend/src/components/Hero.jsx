import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import useAuth from "../context/useAuth.js";

const Motion = motion;

export default function Hero() {
  const { currentUser } = useAuth();
  return (
    <section id="home" className="relative scroll-mt-24 overflow-hidden pt-14 sm:pt-16">
      <div className="container-app">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-balance bg-gradient-to-r from-indigo-200 via-violet-200 to-cyan-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
            >
              Learn Skills. Teach Skills. Grow Together.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
              className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-white/70"
            >
              Exchange knowledge with people around the world. Build a profile,
              match with learners and mentors, and grow your career with real
              collaboration.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              {currentUser ? (
                <>
                  <Link className="btn-primary" to="/explore-skills">
                    Explore Skills
                  </Link>
                  <Link className="btn-secondary" to="/dashboard">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn-primary" to="/signup">
                    Get Started
                  </Link>
                  <Link className="btn-secondary" to="/login">
                    Login
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-10 grid max-w-xl grid-cols-3 gap-3"
            >
              {[
                { k: "Global", v: "Community" },
                { k: "Smart", v: "Matches" },
                { k: "Secure", v: "Messaging" },
              ].map((s) => (
                <div key={s.k} className="glass px-4 py-3">
                  <div className="text-xs font-semibold text-white/55">
                    {s.k}
                  </div>
                  <div className="mt-0.5 text-sm font-extrabold text-white">
                    {s.v}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-cyan-400/25 blur-2xl" />
              <div className="glass overflow-hidden p-4 sm:p-6">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5">
                  <img
                    src={heroImage}
                    alt="Skill exchange"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />

                  <motion.div
                    aria-hidden="true"
                    className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl"
                    animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-fuchsia-500/15 blur-2xl"
                    animate={{ y: [0, -14, 0], x: [0, 12, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -left-6 top-1/2 -z-10 h-24 w-24 -translate-y-1/2 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-cyan-400/10 blur-xl"
              animate={{ rotate: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
