import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function DocumentsScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Tus documentos
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Tickets, garantías y contratos, siempre a mano.
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.emptyState}>
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
            size={40}
          />
          <ThemedText type="subtitle" style={styles.centerText}>
            Todavía no hay nada guardado
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Escanea un ticket o documento y lo verás aquí, con su fecha de caducidad o garantía
            detectada automáticamente.
          </ThemedText>
        </ThemedView>

        <Pressable
          onPress={() => router.push('/scan')}
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
          <SymbolView
            tintColor="#ffffff"
            name={{ ios: 'camera.fill', android: 'photo_camera', web: 'camera' }}
            size={18}
          />
          <ThemedText style={styles.scanButtonText}>Escanear documento</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  emptyState: {
    flex: 1,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#4f46e5',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  scanButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
