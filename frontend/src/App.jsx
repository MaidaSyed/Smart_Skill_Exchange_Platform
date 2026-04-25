import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppRoutes from "./routes/AppRoutes.jsx";
import IntroLoader from "./components/IntroLoader.jsx";

const Motion = motion;

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const INTRO_MS = 5500;
    const FADE_OUT_START_MS = 5000;

    const startEndId = window.setTimeout(
      () => setEnding(true),
      FADE_OUT_START_MS,
    );
    const endId = window.setTimeout(() => {
      setShowIntro(false);
    }, INTRO_MS);

    return () => {
      window.clearTimeout(startEndId);
      window.clearTimeout(endId);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        <motion.div key="intro" exit={{ opacity: 0 }}>
          <IntroLoader ending={ending} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <AppRoutes />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
