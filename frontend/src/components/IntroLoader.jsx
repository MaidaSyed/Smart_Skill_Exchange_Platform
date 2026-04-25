import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brush,
  ChartNoAxesCombined,
  Code2,
  Globe,
  Lightbulb,
  MessageCircle,
} from "lucide-react";

const Motion = motion;

function Robot({ side, label, accent, badge }) {
  const isLeft = side === "left";
  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -48 : 48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.95, ease: "easeOut" }}
      className={[
        "relative",
        "w-[240px] sm:w-[280px]",
        isLeft ? "justify-self-start" : "justify-self-end",
      ].join(" ")}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <div
          className={[
            "absolute -inset-6 -z-10 rounded-[2.25rem] blur-2xl",
            accent,
          ].join(" ")}
        />

        <div className="rounded-[2.25rem] border border-white/10 bg-white/5 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold tracking-widest text-white/70">
              {badge}
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.7)]" />
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="h-2 w-full rounded-full bg-white/10" />
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                {isLeft ? <Code2 size={18} /> : <Brush size={18} />}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="h-10 rounded-2xl bg-white/5" />
            <div className="h-10 rounded-2xl bg-white/10" />
            <div className="h-10 rounded-2xl bg-white/5" />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-white">{label}</div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                Online
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                  Strength
                </div>
                <div className="mt-1 text-sm font-extrabold text-white/90">
                  High
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                  Match
                </div>
                <div className="mt-1 text-sm font-extrabold text-white/90">
                  Ready
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.8)]" />
              <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_16px_rgba(129,140,248,0.8)]" />
              <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
            </div>
            <div className="text-xs font-bold text-white/55">Skill Exchange</div>
          </div>
        </div>

        <div className="pointer-events-none absolute -top-6 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-xl" />
      </motion.div>
    </motion.div>
  );
}

function Portal() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.05, ease: "easeOut", delay: 0.65 }}
      className="relative grid place-items-center"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-56 w-56 rounded-full bg-gradient-to-r from-indigo-500/30 via-violet-500/25 to-cyan-400/30 blur-2xl"
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute h-52 w-52 rounded-full border border-white/10"
        style={{
          background:
            "conic-gradient(from 180deg, rgba(34,211,238,0.0), rgba(34,211,238,0.65), rgba(99,102,241,0.0), rgba(168,85,247,0.65), rgba(34,211,238,0.0))",
          maskImage:
            "radial-gradient(circle, transparent 62%, black 64%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 62%, black 64%, black 100%)",
        }}
      />
      <div className="relative grid h-44 w-44 place-items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-cyan-400/10">
          <div className="h-20 w-20 rounded-full border border-white/10 bg-black/10" />
        </div>
      </div>
    </motion.div>
  );
}

function SkillIcon({ Icon, direction, index }) {
  const Skill = Icon;
  const startX = direction === "leftToRight" ? -170 : 170;
  const endX = -startX;
  const baseDelay = direction === "leftToRight" ? 0.9 : 1.05;
  const delay = baseDelay + index * 0.22;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className="absolute left-1/2 top-1/2"
    >
      <motion.div
        className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/90 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        animate={{
          x: [startX, endX],
          y: [-16 - index * 7, -16 - index * 7],
          opacity: [0, 1, 1, 0],
          scale: [0.85, 1, 1, 0.85],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
      >
        <Skill size={18} />
      </motion.div>
    </motion.div>
  );
}

function Particles() {
  const particles = useMemo(() => {
    const rand = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const count = 14;
    return Array.from({ length: count }, (_, i) => {
      const left = Math.round(rand(10.11 + i * 1.3) * 100);
      const top = Math.round(rand(20.72 + i * 1.7) * 100);
      const size = 2 + Math.round(rand(30.33 + i * 1.1) * 3);
      const duration = 6 + rand(40.44 + i * 1.9) * 6;
      const delay = rand(50.55 + i * 2.1) * 2.2;
      const opacity = 0.12 + rand(60.66 + i * 1.5) * 0.18;
      return { id: i, left, top, size, duration, delay, opacity };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{ y: [0, -18, 0], opacity: [p.opacity, p.opacity + 0.14, p.opacity] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function IntroLoader({ ending }) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowText(true), 2400);
    return () => window.clearTimeout(id);
  }, []);

  const icons = [
    Code2,
    Brush,
    Globe,
    Lightbulb,
    ChartNoAxesCombined,
    MessageCircle,
    BookOpen,
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#070713]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_30%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(900px_circle_at_70%_70%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(900px_circle_at_50%_50%,rgba(168,85,247,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      <Particles />

      <motion.div
        className="relative w-full max-w-6xl px-4 sm:px-6"
        animate={ending ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <div className="grid items-center gap-8 lg:grid-cols-3">
          <Robot
            side="left"
            label="Tech Robot"
            badge="ENGINEERING"
            accent="bg-gradient-to-r from-indigo-500/25 to-cyan-400/20"
          />

          <div className="relative grid place-items-center py-10">
            <Portal />

            <div className="pointer-events-none absolute inset-0">
              {icons.slice(0, 4).map((Icon, idx) => (
                <SkillIcon
                  key={`ltr-${idx}`}
                  Icon={Icon}
                  direction="leftToRight"
                  index={idx}
                />
              ))}
              {icons.slice(3).map((Icon, idx) => (
                <SkillIcon
                  key={`rtl-${idx}`}
                  Icon={Icon}
                  direction="rightToLeft"
                  index={idx}
                />
              ))}
            </div>
          </div>

          <Robot
            side="right"
            label="Creative Robot"
            badge="CREATIVE"
            accent="bg-gradient-to-r from-fuchsia-500/20 to-violet-500/25"
          />
        </div>

        <div className="mt-10">
          <AnimatePresence>
            {showText ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="mx-auto max-w-3xl text-center"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
                  SMART SKILL EXCHANGE PLATFORM
                </div>
                <h1 className="mt-5 bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-200 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                  SMART SKILL EXCHANGE PLATFORM
                </h1>
                <p className="mt-3 text-pretty text-base font-semibold text-white/75 sm:text-lg">
                  Learn Skills. Teach Skills. Grow Together.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
