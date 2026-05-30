import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export type CommandAction =
  | 'launch_session'
  | 'stop_session'
  | 'stop_all'
  | 'get_state';

interface CommandPayload {
  email?: string;
  password?: string;
  concert_url?: string;
  instance_id?: string;
  proxy?: unknown;
}

export async function sendCommand(
  desktopId: string,
  userId: string,
  action: CommandAction,
  payload?: CommandPayload
): Promise<string> {
  const commandData = {
    desktopId,
    userId,
    action,
    payload: payload || {},
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'commands'), commandData);
  return docRef.id;
}

export async function launchSession(
  desktopId: string,
  userId: string,
  email: string,
  password: string,
  concertUrl: string,
  proxy?: unknown
): Promise<string> {
  return sendCommand(desktopId, userId, 'launch_session', {
    email,
    password,
    concert_url: concertUrl,
    proxy,
  });
}

export async function stopSession(
  desktopId: string,
  userId: string,
  instanceId: string
): Promise<string> {
  return sendCommand(desktopId, userId, 'stop_session', {
    instance_id: instanceId,
  });
}

export async function stopAllSessions(
  desktopId: string,
  userId: string
): Promise<string> {
  return sendCommand(desktopId, userId, 'stop_all');
}

export async function refreshState(
  desktopId: string,
  userId: string
): Promise<string> {
  return sendCommand(desktopId, userId, 'get_state');
}
