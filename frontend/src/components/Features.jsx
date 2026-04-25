import { motion } from "framer-motion";

const Motion = motion;

function FeatureIcon({ children }) {
  return (
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20">
      {children}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function Features() {
  const items = [
    {
      title: "Teach What You Know",
      desc: "Share your expertise through sessions, guidance, and real-world mentorship.",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 7.5C4 6.12 5.12 5 6.5 5H18a2 2 0 0 1 2 2v11.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6.5 5v12.5c0 1.38 1.12 2.5 2.5 2.5H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10 9h7M10 12h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      title: "Learn What You Need",
      desc: "Find the exact skill you want and learn faster with curated matches.",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      title: "Connect With Skilled People",
      desc: "Build meaningful connections and collaborate in a trusted community.",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 11a4 4 0 1 0-8 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M4 21a8 8 0 0 1 16 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18 8.5a3.5 3.5 0 1 0-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="scroll-mt-24 py-16 sm:py-20">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Platform Features
          </div>
          <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything you need to exchange skills professionally
          </h2>
          <p className="mt-3 text-pretty text-lg text-white/70">
            Premium design, smart matching, and smooth experiences built for
            learning and teaching.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((it, idx) => (
            <motion.div
              key={it.title}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              custom={idx}
              viewport={{ once: true, amount: 0.3 }}
              className="glass group p-6 text-left transition hover:-translate-y-0.5"
            >
              <FeatureIcon>{it.icon}</FeatureIcon>
              <h3 className="mt-4 text-lg font-extrabold text-white">
                {it.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {it.desc}
              </p>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="mt-4 text-sm font-semibold text-white/75">
                Learn more{" "}
                <span className="inline-block transition group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
