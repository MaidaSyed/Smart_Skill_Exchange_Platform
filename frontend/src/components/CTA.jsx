import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import useAuth from "../context/useAuth.js";

const Motion = motion;

export default function CTA() {
  const { currentUser } = useAuth();
  return (
    <section id="get-started" className="scroll-mt-24 py-16 sm:py-20">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-12 text-white shadow-[0_22px_60px_rgba(99,102,241,0.18)] sm:px-10"
        >
          <div className="absolute inset-0 bg-hero-gradient opacity-60" />
          <div className="relative">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                Start Your Skill Journey Today
              </h2>
              <p className="mt-3 text-pretty text-white/85">
                Join a premium community where teaching and learning feels
                effortless, modern, and rewarding.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                {currentUser ? (
                  <>
                    <Link
                      to="/explore-skills"
                      className="btn bg-white text-slate-900 hover:bg-white/90"
                    >
                      Explore Skills
                    </Link>
                    <Link
                      to="/wallet"
                      className="btn border border-white/35 bg-white/10 text-white hover:bg-white/15"
                    >
                      Wallet
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="btn bg-white text-slate-900 hover:bg-white/90"
                    >
                      Join Now
                    </Link>
                    <Link
                      to="/login"
                      className="btn border border-white/35 bg-white/10 text-white hover:bg-white/15"
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
