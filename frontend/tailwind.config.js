export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#6366F1",
          600: "#4F46E5",
        },
        accent: {
          500: "#22D3EE",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34, 211, 238, 0.18), 0 10px 40px rgba(99, 102, 241, 0.18)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(800px circle at 10% 10%, rgba(34, 211, 238, 0.18), transparent 55%), radial-gradient(900px circle at 90% 30%, rgba(99, 102, 241, 0.22), transparent 60%), radial-gradient(900px circle at 50% 100%, rgba(168, 85, 247, 0.18), transparent 55%)",
      },
    },
  },
  plugins: [],
};
