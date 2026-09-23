import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'unsupported';

interface UseAuthResult {
  status: AuthStatus;
  error: string | null;
  authenticate: () => void;
}

type CheckResult =
  | { status: 'unsupported'; error: string }
  | { status: 'authenticated'; error: null }
  | { status: 'unauthenticated'; error: string };

/** Comprobación pura sin estado de React, para poder llamarla tanto al montar como en
 * reintentos manuales sin duplicar los setState. */
async function checkBiometrics(): Promise<CheckResult> {
  if (Platform.OS === 'web') {
    return { status: 'authenticated', error: null };
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return { status: 'unsupported', error: 'Este dispositivo no tiene soporte de autenticación biométrica.' };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) {
    return { status: 'unsupported', error: 'No hay huella o Face ID registrados en este dispositivo.' };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquea tu Bóveda de Garantías',
    cancelLabel: 'Cancelar',
  });

  if (result.success) {
    return { status: 'authenticated', error: null };
  }

  return { status: 'unauthenticated', error: 'No se pudo verificar tu identidad. Inténtalo de nuevo.' };
}

export function useAuth(): UseAuthResult {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(() => {
    setStatus('checking');
    setError(null);
    checkBiometrics().then((result) => {
      setStatus(result.status);
      setError(result.error);
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    checkBiometrics().then((result) => {
      if (ignore) return;
      setStatus(result.status);
      setError(result.error);
    });

    return () => {
      ignore = true;
    };
  }, []);

  return { status, error, authenticate };
}
