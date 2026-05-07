import type { TFunction } from 'i18next';
import { ApiError } from '@/lib/api-client';

type BackendFieldError = {
  field: string;
  message: string;
};

type ErrorDetails = {
  fieldErrors?: BackendFieldError[];
};

export type AuthFieldErrors = Record<string, string>;

function fieldLabelKey(field: string): string {
  switch (field) {
    case 'name':
      return 'auth.name';
    case 'email':
      return 'auth.email';
    case 'password':
      return 'auth.password';
    case 'password_confirm':
      return 'auth.confirmPassword';
    case 'human_answer':
      return 'auth.register.humanCheckLabel';
    case 'role_key':
      return 'auth.register.role';
    case 'token':
      return 'auth.confirmEmail.token';
    default:
      return field;
  }
}

function genericFieldMessage(field: string, code: string, t: TFunction): string {
  const fieldLabel = t(fieldLabelKey(field), { defaultValue: field });

  switch (code) {
    case 'required':
      return t('auth.validation.generic.required', { field: fieldLabel });
    case 'too_short':
      return t('auth.validation.generic.tooShort', { field: fieldLabel });
    case 'too_long':
      return t('auth.validation.generic.tooLong', { field: fieldLabel });
    case 'invalid':
      return t('auth.validation.generic.invalid', { field: fieldLabel });
    default:
      return t('errors.request.validation_failed');
  }
}

function translateFieldError(field: string, code: string, t: TFunction): string {
  if (field === 'email' && code === 'invalid_email') {
    return t('auth.validation.email.invalidEmail');
  }

  if (field === 'password') {
    if (code === 'too_short') return t('auth.validation.password.tooShort');
    if (code === 'password_no_number') return t('auth.validation.password.noNumber');
    if (code === 'password_no_special') return t('auth.validation.password.noSpecial');
    if (code === 'password_sequential') return t('auth.validation.password.sequential');
  }

  if (field === 'password_confirm' && code === 'mismatch') {
    return t('auth.validation.passwordConfirm.mismatch');
  }

  return genericFieldMessage(field, code, t);
}

export function getAuthFieldErrors(error: unknown, t: TFunction): AuthFieldErrors {
  if (!(error instanceof ApiError) || error.messageKey !== 'request.validation_failed') {
    return {};
  }

  const details = error.details as ErrorDetails | undefined;
  const fieldErrors = details?.fieldErrors;

  if (!Array.isArray(fieldErrors) || fieldErrors.length === 0) {
    return {};
  }

  return fieldErrors.reduce<AuthFieldErrors>((acc, fieldError) => {
    acc[fieldError.field] = translateFieldError(fieldError.field, fieldError.message, t);
    return acc;
  }, {});
}
