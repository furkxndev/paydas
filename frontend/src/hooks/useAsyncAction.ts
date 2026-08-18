import { useCallback, useRef, useState } from 'react';

import { useToast } from './useToast';

interface Options {
  successMessage?: string;
  /** Hata mesajı otomatik toast olarak gösterilsin mi */
  showErrorToast?: boolean;
  onSuccess?: () => void;
}

/**
 * Form gönderimlerini tek yerden yönetir:
 * yüklenme durumu, hata yakalama ve kullanıcıya geri bildirim.
 */
export const useAsyncAction = <TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: Options = {},
) => {
  const { successMessage, showErrorToast = true, onSuccess } = options;
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const result = await action(...args);
        if (successMessage) showSuccess(successMessage);
        onSuccess?.();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'İşlem tamamlanamadı';
        setError(message);
        if (showErrorToast) showError(message);
        return undefined;
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [action, onSuccess, showError, showErrorToast, showSuccess, successMessage],
  );

  return { run, loading, error };
};
