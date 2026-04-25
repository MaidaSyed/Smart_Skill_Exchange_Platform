import { useCallback, useEffect, useState } from "react";
import {
  getSession,
  signInEmail,
  signOut,
  signUpEmail,
} from "../services/neonAuth.js";
import {
  createUserRole,
  getProfile,
  getUserRole,
  getUserSkills,
} from "../services/api.js";
import AuthContext from "./authContext.js";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setCurrentUser(null);
    setRole(null);
    setProfile(null);
    setSkills([]);
  }, []);

  const refreshUserData = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setSkills([]);
      setRole(null);
      return { profile: null, role: null };
    }

    try {
      const [p, s] = await Promise.all([
        getProfile(userId),
        getUserSkills(userId),
      ]);
      setProfile(p.profile);
      if (p.role !== undefined) setRole(p.role);
      setSkills(s);
      return { profile: p.profile || null, role: p.role ?? null };
    } catch {
      const _IGNORE = 0;
    }

    try {
      const [r, s] = await Promise.all([getUserRole(userId), getUserSkills(userId)]);
      setRole(r);
      setSkills(s);
      return { profile: null, role: r ?? null };
    } catch {
      setRole(null);
      setSkills([]);
      setProfile(null);
      return { profile: null, role: null };
    }
  }, []);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getSession();
      setSession(s?.session || null);
      setCurrentUser(s?.user || null);

      const out = await refreshUserData(s?.user?.id);
      if (out?.profile?.is_suspended) {
        await logout();
      }
    } catch {
      setSession(null);
      setCurrentUser(null);
      setRole(null);
      setProfile(null);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [logout, refreshUserData]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      hydrate();
    }, 0);
    return () => window.clearTimeout(id);
  }, [hydrate]);

  useEffect(() => {
    const onForceLogout = () => {
      logout().catch(() => {
        const _IGNORE = 0;
      });
    };
    window.addEventListener("auth:force-logout", onForceLogout);
    return () => window.removeEventListener("auth:force-logout", onForceLogout);
  }, [logout]);

  const login = useCallback(async ({ email, password, rememberMe }) => {
    const data = await signInEmail({ email, password, rememberMe });
    setSession(data?.session || null);
    setCurrentUser(data?.user || data?.session?.user || null);

    const userId = data?.user?.id || data?.session?.user?.id;
    const out = await refreshUserData(userId);
    if (out?.profile?.is_suspended) {
      await logout();
      throw new Error("Account suspended.");
    }
    return data;
  }, [logout, refreshUserData]);

  const signup = useCallback(async ({ fullName, email, password }) => {
    const data = await signUpEmail({ email, password, name: fullName });
    const user = data?.user || data?.session?.user || null;

    setSession(data?.session || null);
    setCurrentUser(user);

    if (user?.id) {
      const selectedRole = "user";
      console.log("Neon Auth user.id:", user.id);
      try {
        await createUserRole(user.id, { email: user?.email || email });
        console.log("Inserted role:", selectedRole);
      } catch (e) {
        console.log("Role insert failed:", e?.message || e);
      }
      setRole(selectedRole);
    }

    await refreshUserData(user?.id);
    return data;
  }, [refreshUserData]);

  const value = {
    currentUser,
    session,
    role,
    profile,
    skills,
    loading,
    login,
    signup,
    logout,
    refresh: hydrate,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
