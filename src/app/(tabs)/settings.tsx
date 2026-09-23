import { SymbolView } from 'expo-symbols';
import Constants from 'expo-constants';
import type { SFSymbols7_0 } from 'sf-symbols-typescript';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function SettingsRow({
  icon,
  label,
  hint,
}: {
  icon: SFSymbols7_0;
  label: string;
  hint: string;
}) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <SymbolView tintColor={theme.textSecondary} name={{ ios: icon, web: 'circle' }} size={20} />
      <ThemedView style={styles.rowText}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Ajustes</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Seguridad y datos de la bóveda.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <SettingsRow
            icon="faceid"
            label="Bloqueo con biometría"
            hint="Face ID / huella activados: hay que verificar identidad para abrir la app"
          />
          <SettingsRow
            icon="lock.shield"
            label="Cifrado local"
            hint="Cada documento se cifra con AES-256 antes de guardarse; la clave vive en Keychain/Keystore"
          />
          <SettingsRow
            icon="bell.badge"
            label="Avisos de caducidad"
            hint="Próximamente: recordatorios antes de que expire una garantía"
          />
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
          Versión {Constants.expoConfig?.version ?? '1.0.0'}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  version: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
});
