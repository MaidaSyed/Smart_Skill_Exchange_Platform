import { createClient } from "@neondatabase/neon-js";
import { createAuthClient } from "@neondatabase/neon-js/auth";

// Add these to: frontend/.env
// VITE_NEON_URL=YOUR_NEON_AUTH_URL
// VITE_NEON_DATA_API_URL=YOUR_NEON_DATA_API_URL
// VITE_NEON_ANON_KEY= (Not used by neon-js; kept for compatibility with older Supabase-style setups)
const neonAuthUrl =
  import.meta.env.VITE_NEON_AUTH_URL || import.meta.env.VITE_NEON_URL;
const neonDataApiUrl =
  import.meta.env.VITE_NEON_DATA_API_URL || import.meta.env.VITE_NEON_DATA_URL;

export const authClient =
  neonAuthUrl && typeof neonAuthUrl === "string"
    ? createAuthClient(neonAuthUrl)
    : null;

export const dataClient =
  neonAuthUrl && neonDataApiUrl && typeof neonAuthUrl === "string"
    ? createClient({
        auth: { url: neonAuthUrl },
        dataApi: { url: neonDataApiUrl },
      })
    : null;

export function isNeonConfigured() {
  return Boolean(neonAuthUrl);
}

export function isNeonDataApiConfigured() {
  return Boolean(neonAuthUrl && neonDataApiUrl);
}

function requireAuth() {
  if (!authClient) {
    throw new Error(
      "Neon Auth is not configured. Add VITE_NEON_URL (or VITE_NEON_AUTH_URL) to your frontend .env file.",
    );
  }
  return authClient;
}

function requireDataApi() {
  if (!neonDataApiUrl || !dataClient) {
    throw new Error(
      "Neon Data API is not configured. Set VITE_NEON_DATA_API_URL in your .env file to read/write tables like user_roles.",
    );
  }
  return dataClient;
}

export async function signUpEmail({ email, password, name }) {
  const client = requireAuth();
  const result = await client.signUp.email({ email, password, name });
  if (result.error) throw result.error;
  return {
    session: result.data?.session || null,
    user: result.data?.user || null,
  };
}

export async function signInEmail({ email, password, rememberMe }) {
  const client = requireAuth();
  const result = await client.signIn.email({ email, password, rememberMe });
  if (result.error) throw result.error;
  return {
    session: result.data?.session || null,
    user: result.data?.user || null,
  };
}

export async function signOut() {
  const client = requireAuth();
  const result = await client.signOut();
  if (result?.error) throw result.error;
  return true;
}

export async function getSession() {
  if (!authClient) return null;
  const result = await authClient.getSession();
  if (result.error) throw result.error;
  if (!result.data?.session) return null;
  return {
    session: result.data.session,
    user: result.data.user || null,
  };
}

export async function saveUserRole({ authUserId, role }) {
  if (!neonDataApiUrl) {
    localStorage.setItem(`ssep_role_${authUserId}`, role);
    return true;
  }

  const client = requireDataApi();
  const { error } = await client
    .from("user_roles")
    .insert({ auth_user_id: authUserId, role });
  if (error) throw error;
  return true;
}

export async function fetchUserRole({ authUserId }) {
  if (!neonDataApiUrl) {
    return localStorage.getItem(`ssep_role_${authUserId}`) || null;
  }

  const client = requireDataApi();
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  return data?.role || null;
}
