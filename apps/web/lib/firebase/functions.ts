/**
 * Crowdbeats V2 — Firebase Functions Web Client SDK
 *
 * Provides typed callable function execution with automatic emulator support.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { firebaseApp } from './app';

let _functions: Functions | null = null;
let _emulatorConnected = false;

export function getFirebaseFunctions(): Functions {
  if (_functions) return _functions;
  _functions = getFunctions(firebaseApp, 'us-central1');

  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !_emulatorConnected
  ) {
    connectFunctionsEmulator(_functions, '127.0.0.1', 5001);
    _emulatorConnected = true;
  }

  return _functions;
}

export async function callCallableFunction<TReq, TRes>(
  functionName: string,
  data: TReq,
): Promise<TRes> {
  const fns = getFirebaseFunctions();
  const callable = httpsCallable<TReq, TRes>(fns, functionName);
  const result = await callable(data);
  return result.data;
}
