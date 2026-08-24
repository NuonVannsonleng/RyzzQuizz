import { useEffect, useState } from 'react';
import { socket } from '../lib/socket.js';
import { useI18n } from '../i18n/index.js';

type Status = 'connected' | 'reconnecting' | 'disconnected';

/** Only meaningful on Host/Play pages — Home never opens a socket, so it's omitted there. */
export function ConnectionStatus() {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>(socket.connected ? 'connected' : 'disconnected');

  useEffect(() => {
    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onReconnectAttempt = () => setStatus('reconnecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onConnect);
    };
  }, []);

  const dot = status === 'connected' ? '🟢' : status === 'reconnecting' ? '🟡' : '🔴';
  const label = t(`common.${status}`);

  return (
    <span className={`connstatus connstatus--${status}`} title={label}>
      <span aria-hidden="true">{dot}</span>
      <span className="connstatus__label">{label}</span>
    </span>
  );
}
