import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ScanScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={12}>
          <SymbolView
            tintColor={theme.text}
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={20}
          />
        </Pressable>

        <ThemedView style={styles.body}>
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'camera.viewfinder', android: 'photo_camera', web: 'camera' }}
            size={48}
          />
          <ThemedText type="subtitle" style={styles.centerText}>
            Escaneo de documentos
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Aquí abriremos la cámara para capturar el ticket o documento, extraer el texto con
            OCR y detectar tienda, importe y fecha de caducidad automáticamente. Todavía no está
            implementado.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
});
