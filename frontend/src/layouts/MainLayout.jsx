import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function MainLayout() {
  return (
    <div className="relative min-h-screen bg-[#070713]">
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_30%_20%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(900px_circle_at_70%_70%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(900px_circle_at_50%_50%,rgba(168,85,247,0.14),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />
      <div className="relative min-h-screen">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
