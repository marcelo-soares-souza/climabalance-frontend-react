import { API_BASE } from "@/config/api";
import { csrfToken } from "./csrf-token";

type SessionBootstrapResponse = {
  csrfToken: string;
};

export async function ensureSessionCsrfToken(): Promise<string | null> {
  const currentToken = csrfToken.get();
  if (currentToken) return currentToken;

  const response = await fetch(`${API_BASE}/auth/session`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 204 || response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Session bootstrap failed");
  }

  const payload = await response.json();
  const data = (payload.data ?? payload) as SessionBootstrapResponse;
  if (!data.csrfToken) {
    return null;
  }

  csrfToken.set(data.csrfToken);
  return data.csrfToken;
}
