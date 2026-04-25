import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container-app flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-extrabold tracking-tight text-white">
            SMART SKILL EXCHANGE PLATFORM
          </div>
          <div className="mt-1 text-sm text-white/65">
            Learn. Teach. Grow together.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/70">
          <Link className="rounded-lg px-2 py-1 hover:text-white" to="/">
            Home
          </Link>
          <Link className="rounded-lg px-2 py-1 hover:text-white" to="/login">
            Login
          </Link>
          <Link className="rounded-lg px-2 py-1 hover:text-white" to="/signup">
            Sign Up
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} SMART SKILL EXCHANGE PLATFORM. All rights
        reserved.
      </div>
    </footer>
  );
}
