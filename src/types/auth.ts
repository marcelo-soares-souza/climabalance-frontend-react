export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
  human_challenge_id: string;
  human_answer: string;
  locale?: string;
  role_key?: string;
  accepted_privacy: boolean;
  accepted_terms: boolean;
}

export interface RegisterResponse {
  id: string;
  email: string;
  status: string;
}

export interface HumanCheckChallenge {
  challenge_id: string;
  question: string;
  locale: string;
}

export type RefreshRequest = Record<string, never>;

export interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface JwtPayload {
  sub: string;
  roles: string[];
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AuthSession {
  userId: string;
  email: string;
  roles: string[];
  accessToken: string;
  expiresAt: number;
}
