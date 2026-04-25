import { motion } from "framer-motion";
import Hero from "../components/Hero.jsx";
import Features from "../components/Features.jsx";
import CTA from "../components/CTA.jsx";

const Motion = motion;

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Create Profile",
      desc: "Show who you are, what you teach, and what you want to learn.",
    },
    {
      n: "02",
      title: "Add Skills",
      desc: "List your skills with clear levels so matching feels effortless.",
    },
    {
      n: "03",
      title: "Match & Exchange",
      desc: "Connect with the right people and start exchanging knowledge.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-20">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-pretty text-lg text-white/70">
            A simple, premium flow designed for speed, trust, and great matches.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, idx) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: idx * 0.06, ease: "easeOut" }}
              className="glass p-6 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-white">
                  {s.title}
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/75">
                  {s.n}
                </div>
              </div>
              <div className="mt-3 text-sm leading-relaxed text-white/70">
                {s.desc}
              </div>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/75">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Premium matching experience
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </div>
  );
}
