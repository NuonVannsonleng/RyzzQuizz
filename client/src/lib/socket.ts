import { io, type Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, ServerToClientEvents } from '@ryzzquizz/shared';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const socket: AppSocket = io({ autoConnect: false });

type Payload<E extends keyof ClientToServerEvents> =
  Parameters<ClientToServerEvents[E]>[0];

type AckData<E extends keyof ClientToServerEvents> =
  Parameters<Parameters<ClientToServerEvents[E]>[1]>[0] extends Ack<infer T> ? T : never;

/** Promise wrapper over the ack callbacks so components can await + try/catch. */
export function emit<E extends keyof ClientToServerEvents>(
  event: E,
  payload: Payload<E>,
): Promise<AckData<E>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not respond')), 8000);
    (socket as Socket).emit(event, payload, (res: Ack<AckData<E>>) => {
      clearTimeout(timeout);
      if (res.ok) resolve(res.data);
      else reject(new Error(res.error));
    });
  });
}

export function connect(): void {
  if (!socket.connected) socket.connect();
}
