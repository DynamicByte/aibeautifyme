export interface AuthResponse {
  results?: {
    access_token?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Base URL for Philex API (PRODUCTION)
export const BASE_URL = "https://philex-api-node-qi3ie.ondigitalocean.app/api/v1";

// Base URL for Philex API (TESTING) -- COMMENT OUT ON DEPLOYMENT
// export const BASE_URL = "https://philex-api-staging-app-9so4o.ondigitalocean.app/api/v1";

export const P_EMAIL = process.env.PHILEX_EMAIL;
export const P_PASSWORD = process.env.PHILEX_PASSWORD;

// Supabase Edge Function only!

// export async function authenticatePhilex(): Promise<string> {
//   const res = await fetch("https://bzwcaxnpnfbckbixetig.supabase.co/functions/v1/philex-auth");
//   if (!res.ok) throw new Error("Auth function failed");
//   const data = await res.json();
//   return data.token;
// }

export async function authenticatePhilex(): Promise<string> {
  const res = await fetch(`${BASE_URL}/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: P_EMAIL,
      password: P_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error("Authentication failed");
  }

  const data: AuthResponse = await res.json();

  if (!data?.results?.access_token) {
    throw new Error("No access token returned");
  }

  return data?.results?.access_token;
}