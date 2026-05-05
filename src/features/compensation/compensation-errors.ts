import { ApiError } from '@/lib/api-client';

type BackendFieldError = {
  field?: string;
  message?: string;
};

type BackendErrorDetails = {
  fieldErrors?: BackendFieldError[];
};

export function mapCompensationApiError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'compensation.error';
  }

  if (error.messageKey !== 'request.validation_failed') {
    return error.messageKey;
  }

  const details = (error.details ?? {}) as BackendErrorDetails;
  const fieldErrors = details.fieldErrors;

  if (!Array.isArray(fieldErrors) || fieldErrors.length === 0) {
    return error.messageKey;
  }

  const hasTreeLimitExceeded = fieldErrors.some((fieldError) => {
    if (typeof fieldError.message !== 'string') return false;
    return fieldError.message.includes('tree_limit_exceeded');
  });

  if (hasTreeLimitExceeded) {
    return 'compensation.tree_limit_exceeded';
  }

  const hasProducerNotOnboarded = fieldErrors.some((fieldError) => {
    if (typeof fieldError.message !== 'string') return false;
    return fieldError.message.includes('producer_not_onboarded');
  });

  if (hasProducerNotOnboarded) {
    return 'compensation.producer_not_onboarded';
  }

  return error.messageKey;
}
