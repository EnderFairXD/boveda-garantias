import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function AuthGate({ children }: PropsWithChildren) {
  const { status, error, authenticate } = useAuth();

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.icon}>🔒</ThemedText>
      <ThemedText type="subtitle" style={styles.centerText}>
        Bóveda de Garantías
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        Tus documentos están cifrados. Verifica tu identidad para continuar.
      </ThemedText>

      {status === 'checking' ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <>
          {error && (
            <ThemedText style={[styles.centerText, styles.error]}>{error}</ThemedText>
          )}
          <Pressable onPress={authenticate} style={styles.button}>
            <ThemedText style={styles.buttonText}>Desbloquear</ThemedText>
          </Pressable>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.one,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  error: {
    color: '#dc2626',
    marginTop: Spacing.two,
  },
  spinner: {
    marginTop: Spacing.four,
  },
  button: {
    marginTop: Spacing.four,
    backgroundColor: '#4f46e5',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
