import { api } from '@/lib/api-client';
import { API_BASE } from '@/config/api';
import type { HumanCheckChallenge, LoginResponse, RegisterRequest, RegisterResponse } from '@/types/auth';

export const authService = {
  login(email: string, password: string) {
    return api.post<LoginResponse>('/auth/login', { email, password });
  },

  register(data: RegisterRequest) {
    return api.post<RegisterResponse>('/auth/register', data);
  },

  getHumanCheck(locale = 'pt-BR') {
    return api.get<HumanCheckChallenge>('/auth/human-check', { params: { locale } });
  },

  confirmEmail(token: string) {
    return api.post<void>('/auth/confirm-email', { token });
  },

  resendConfirmationEmail(email: string) {
    return api.post<void>('/auth/confirm-email/resend', { email });
  },

  requestPasswordReset(email: string, locale = 'pt-BR') {
    return api.post<void>('/auth/password-reset/request', { email, locale });
  },

  resetPassword(token: string, password: string, password_confirm: string) {
    return api.post<void>('/auth/password-reset/confirm', { token, password, password_confirm });
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const json = await res.json();
    return json.data || json;
  },

  revokeToken(refreshToken: string) {
    return api.post<void>('/auth/revoke', { refresh_token: refreshToken });
  },
};
