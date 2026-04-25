import { motion } from "framer-motion";

const Motion = motion;

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-hero-gradient">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass w-full max-w-xl px-8 py-10"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-white/40 border-t-white"
            />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className="mt-6 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl"
          >
            SMART SKILL EXCHANGE PLATFORM
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
            className="mt-2 text-sm font-semibold text-slate-600"
          >
            Loading your premium experience…
          </motion.p>

          <div className="mt-8 flex items-center justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-3 w-3 rounded-full bg-cyan-400"
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -z-10 h-72 w-72 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-400/20 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.85, 0.6] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
