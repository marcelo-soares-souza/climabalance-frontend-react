export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  locale?: string;
  role_key?: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  status: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
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
  refreshToken: string;
  expiresAt: number;
}
