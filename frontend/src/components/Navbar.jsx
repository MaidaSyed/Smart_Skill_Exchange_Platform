import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import useAuth from "../context/useAuth.js";
import {
  getNotifications,
  getNotificationsUnreadCount,
  markNotificationsSeen,
} from "../services/api.js";

const Motion = motion;

const navLinkClassName = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive ? "text-white" : "text-white/75 hover:text-white",
    "hover:bg-white/10",
  ].join(" ");

export default function Navbar() {
  const { currentUser, profile, logout, skills, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const links = useMemo(() => {
    if (!currentUser?.id)
      return [
        { to: "/", label: "Home" },
        { to: "/#features", label: "Features" },
        { to: "/#how-it-works", label: "How it works" },
        { to: "/#get-started", label: "Get started" },
      ];
    if (role === "admin")
      return [
        { to: "/admin", label: "Dashboard" },
        { to: "/admin?tab=users", label: "Users" },
        { to: "/admin?tab=skills", label: "Skills" },
        { to: "/admin?tab=sessions", label: "Sessions" },
        { to: "/admin?tab=reports", label: "Reports" },
      ];
    return [
      { to: "/home", label: "Home" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/explore-skills", label: "Explore Skills" },
      { to: "/my-requests", label: "My Requests" },
      { to: "/sessions", label: "Sessions" },
    ];
  }, [currentUser, role]);

  const navItemClassName =
    "rounded-lg px-3 py-2 text-sm font-semibold transition text-white/75 hover:text-white hover:bg-white/10";
  const scrollToHash = useCallback((hash) => {
    const id = String(hash || "").replace(/^#/, "");
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }, []);

  const scrollToHashWithRetry = useCallback((hash) => {
    const maxAttempts = 30;
    const delayMs = 40;
    let attempt = 0;
    const run = () => {
      attempt += 1;
      const ok = scrollToHash(hash);
      if (ok) return;
      if (attempt >= maxAttempts) return;
      window.setTimeout(run, delayMs);
    };
    run();
  }, [scrollToHash]);

  const onNavClick = (to) => {
    setOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);

    const url = new URL(String(to), window.location.origin);
    if ((url.pathname === "/" || url.pathname === "/home") && url.hash) {
      if (location.pathname === url.pathname) {
        window.history.replaceState({}, "", `${url.pathname}${url.hash}`);
        scrollToHashWithRetry(url.hash);
      } else {
        navigate(`${url.pathname}${url.hash}`);
      }
    }
  };

  useEffect(() => {
    if (location.pathname !== "/" && location.pathname !== "/home") return;
    if (!location.hash) return;
    const id = window.setTimeout(() => scrollToHashWithRetry(location.hash), 0);
    return () => window.clearTimeout(id);
  }, [location.hash, location.pathname, scrollToHashWithRetry]);


  const initials = useMemo(() => {
    const name =
      profile?.full_name ||
      currentUser?.name ||
      currentUser?.email?.split("@")?.[0] ||
      "U";
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [currentUser, profile]);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      if (role === "admin") {
        setNotificationsUnread(0);
        setNotifications([]);
        return;
      }
      if (!currentUser?.id) {
        setNotificationsUnread(0);
        setNotifications([]);
        return;
      }

      getNotificationsUnreadCount(currentUser.id)
        .then((c) => {
          if (cancelled) return;
          setNotificationsUnread(Number(c) || 0);
        })
        .catch(() => {
          if (cancelled) return;
          setNotificationsUnread(0);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [currentUser?.id, role]);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      if (role === "admin") return;
      if (!notificationsOpen || !currentUser?.id) return;

      setNotificationsLoading(true);
      getNotifications(currentUser.id, { limit: 25 })
        .then((rows) => {
          if (cancelled) return;
          setNotifications(rows);
        })
        .catch(() => {
          if (cancelled) return;
          setNotifications([]);
        })
        .finally(() => {
          if (cancelled) return;
          setNotificationsLoading(false);
        });

      markNotificationsSeen(currentUser.id)
        .then((r) => {
          if (cancelled) return;
          setNotificationsUnread(Number(r?.unreadCount) || 0);
        })
        .catch(() => {
          if (cancelled) return;
          setNotificationsUnread(0);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [currentUser?.id, notificationsOpen, role]);

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container-app flex h-16 items-center justify-between">
          <Link
            to={currentUser ? (role === "admin" ? "/admin" : "/dashboard") : "/"}
            className="group inline-flex items-center gap-2 font-extrabold tracking-tight text-white"
            onClick={() => {
              setOpen(false);
              setProfileOpen(false);
              setNotificationsOpen(false);
            }}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20">
              S
            </span>
            <span className="text-sm sm:text-base">
              SMART SKILL <span className="text-white/60">EXCHANGE</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) =>
              String(l.to).startsWith("/#") ? (
                <Link
                  key={l.label}
                  to={l.to}
                  className={navItemClassName}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavClick(l.to);
                  }}
                >
                  {l.label}
                </Link>
              ) : (
                <NavLink
                  key={l.label}
                  to={l.to}
                  className={navLinkClassName}
                  end
                  onClick={() => onNavClick(l.to)}
                >
                  {l.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {currentUser && role !== "admin" ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition hover:bg-white/10"
                    onClick={() => {
                      setNotificationsOpen((v) => !v);
                      setProfileOpen(false);
                    }}
                    aria-label="Notifications"
                    aria-expanded={notificationsOpen}
                  >
                    <Bell size={18} />
                    {notificationsUnread > 0 ? (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.65)]" />
                    ) : null}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-[#070713]/90 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                      >
                        <div className="border-b border-white/10 px-4 py-3">
                          <div className="text-sm font-extrabold text-white">
                            Notifications
                          </div>
                          <div className="mt-1 text-xs font-semibold text-white/60">
                            {notificationsUnread > 0 ? `${notificationsUnread} unread` : "All caught up"}
                          </div>
                        </div>
                        <div className="max-h-[22rem] overflow-auto p-2">
                          {notificationsLoading ? (
                            <div className="px-3 py-3 text-sm font-semibold text-white/70">
                              Loading…
                            </div>
                          ) : notifications.length ? (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                className="rounded-xl px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
                              >
                                <div className="text-white">{n.title}</div>
                                <div className="mt-1 text-xs font-semibold text-white/55">
                                  {n.message}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-sm font-semibold text-white/70">
                              No notifications yet.
                            </div>
                          )}
                        </div>
                        <div className="border-t border-white/10 p-2">
                          <NavLink
                            to="/notifications"
                            onClick={() => setNotificationsOpen(false)}
                            className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                          >
                            Open Notifications
                          </NavLink>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-extrabold text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition hover:bg-white/10"
                    onClick={() => {
                      setProfileOpen((v) => !v);
                      setNotificationsOpen(false);
                    }}
                    aria-label="Profile"
                    aria-expanded={profileOpen}
                  >
                    {initials}
                  </button>

                  <AnimatePresence>
                    {profileOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#070713]/90 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                      >
                        <div className="border-b border-white/10 px-4 py-3">
                          <div className="text-sm font-extrabold text-white">
                            {profile?.full_name || "Your Profile"}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-white/60">
                            {skills?.length || 0} skills
                          </div>
                        </div>
                        <div className="p-2">
                          {role === "admin" ? (
                            <NavLink
                              to="/admin"
                              onClick={() => setProfileOpen(false)}
                              className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                            >
                              Admin Panel
                            </NavLink>
                          ) : (
                            <>
                              <NavLink
                                to="/profile"
                                onClick={() => setProfileOpen(false)}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                View Profile
                              </NavLink>
                              <NavLink
                                to="/edit-profile"
                                onClick={() => setProfileOpen(false)}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                Edit Profile
                              </NavLink>
                              <NavLink
                                to="/my-requests"
                                onClick={() => setProfileOpen(false)}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                My Requests
                              </NavLink>
                              <NavLink
                                to="/messages"
                                onClick={() => setProfileOpen(false)}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                Messages
                              </NavLink>
                              <NavLink
                                to="/notifications"
                                onClick={() => setProfileOpen(false)}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                Notifications
                              </NavLink>
                              <NavLink
                                to="/wallet"
                                onClick={() => setProfileOpen(false)}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                Wallet
                              </NavLink>
                              <NavLink
                                to="/sessions"
                                onClick={() => setProfileOpen(false)}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                Sessions
                              </NavLink>
                            </>
                          )}
                          <button
                            type="button"
                            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => {
                              setProfileOpen(false);
                              logout();
                            }}
                          >
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {currentUser ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      logout();
                    }}
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <NavLink to="/login" className="btn-ghost">
                      Login
                    </NavLink>
                    <NavLink to="/signup" className="btn-primary">
                      Sign Up
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>

          {currentUser && role !== "admin" ? (
            <div className="relative md:hidden">
              <button
                type="button"
                className="btn-ghost relative"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />
                {notificationsUnread > 0 ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.65)]" />
                ) : null}
              </button>

              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-12 w-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-[#070713]/95 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                  >
                    <div className="border-b border-white/10 px-4 py-3">
                      <div className="text-sm font-extrabold text-white">Notifications</div>
                      <div className="mt-1 text-xs font-semibold text-white/60">
                        {notificationsUnread > 0 ? `${notificationsUnread} unread` : "All caught up"}
                      </div>
                    </div>
                    <div className="max-h-[22rem] overflow-auto p-2">
                      {notificationsLoading ? (
                        <div className="px-3 py-3 text-sm font-semibold text-white/70">
                          Loading…
                        </div>
                      ) : notifications.length ? (
                        notifications.map((n) => (
                          <div
                            key={`${n.id}-m`}
                            className="rounded-xl px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
                          >
                            <div className="text-white">{n.title}</div>
                            <div className="mt-1 text-xs font-semibold text-white/55">
                              {n.message}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm font-semibold text-white/70">
                          No notifications yet.
                        </div>
                      )}
                    </div>
                    <div className="border-t border-white/10 p-2">
                      <NavLink
                        to="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        Open Notifications
                      </NavLink>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}

          <button
            type="button"
            className="btn-ghost md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="relative block h-5 w-6">
              <span
                className={[
                  "absolute left-0 top-1 h-0.5 w-6 rounded bg-white transition",
                  open ? "translate-y-2 rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-2.5 h-0.5 w-6 rounded bg-white transition",
                  open ? "opacity-0" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-4 h-0.5 w-6 rounded bg-white transition",
                  open ? "-translate-y-2 -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-b border-white/10 bg-black/20 backdrop-blur-xl md:hidden"
          >
            <div className="container-app flex flex-col gap-2 py-3">
              <div className="flex flex-col gap-1">
                {links.map((l) =>
                  String(l.to).startsWith("/#") ? (
                    <Link
                      key={l.label}
                      to={l.to}
                      className={navItemClassName}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavClick(l.to);
                      }}
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <NavLink
                      key={l.label}
                      to={l.to}
                      className={navLinkClassName}
                      end
                      onClick={() => onNavClick(l.to)}
                    >
                      {l.label}
                    </NavLink>
                  ),
                )}
              </div>
              <div className="flex gap-2 pt-2">
                {currentUser ? (
                  <>
                    {role !== "admin" ? (
                      <NavLink to="/profile" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
                        Profile
                      </NavLink>
                    ) : null}
                    <button
                      type="button"
                      className="btn-primary flex-1"
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      className="btn-secondary flex-1"
                      onClick={() => setOpen(false)}
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/signup"
                      className="btn-primary flex-1"
                      onClick={() => setOpen(false)}
                    >
                      Sign Up
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
