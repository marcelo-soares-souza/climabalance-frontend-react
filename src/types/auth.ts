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
  email: string;
  password: string;
  password_confirm: string;
  human_challenge_id: string;
  human_answer: string;
  locale?: string;
  role_key?: string;
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

export interface RefreshRequest {}

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
