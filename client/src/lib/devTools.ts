import { useEffect, useState } from 'react';

export type DevStatusReason = 'ok' | 'disabled-on-server' | 'needs-developer-role';

export interface DevStatus {
  enabled: boolean;
  reason: DevStatusReason;
}

/**
 * Server's answer to "may this caller use developer tools?" — the env switch
 * AND the caller's database role, decided server-side. Refetched whenever the
 * signed-in user changes, since the answer depends on who's asking.
 */
export function useDevStatus(userId: string | null): DevStatus {
  const [status, setStatus] = useState<DevStatus>({ enabled: false, reason: 'disabled-on-server' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dev/status', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: DevStatus) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ enabled: false, reason: 'disabled-on-server' });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return status;
}
