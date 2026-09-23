import {
  launchCameraAsync,
  launchImageLibraryAsync,
  PermissionStatus,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { extractTextFromImage, isSupported as isOcrSupported } from 'expo-text-extractor';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveDocument } from '@/utils/document-store';
import { parseReceiptText } from '@/utils/parse-receipt';

type Phase = 'idle' | 'processing' | 'review' | 'saving';

interface Draft {
  imageUri: string;
  storeName: string;
  amount: string;
  date: string;
  rawText: string;
}

export default function ScanScreen() {
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState<Draft | null>(null);

  const processImage = async (uri: string) => {
    setPhase('processing');
    try {
      const lines = isOcrSupported ? await extractTextFromImage(uri) : [];
      if (!isOcrSupported) {
        Alert.alert(
          'OCR no disponible',
          'Este dispositivo no soporta reconocimiento de texto. Puedes rellenar los datos a mano.',
        );
      }
      const parsed = parseReceiptText(lines);
      setDraft({
        imageUri: uri,
        storeName: parsed.storeName ?? '',
        amount: parsed.amount !== null ? String(parsed.amount) : '',
        date: parsed.date ?? '',
        rawText: lines.join('\n'),
      });
      setPhase('review');
    } catch (error) {
      setPhase('idle');
      Alert.alert('Error al leer el documento', error instanceof Error ? error.message : String(error));
    }
  };

  const handleCamera = async () => {
    const permission = await requestCameraPermissionsAsync();
    if (permission.status !== PermissionStatus.GRANTED) {
      Alert.alert('Permiso necesario', 'Concede acceso a la cámara para escanear documentos.');
      return;
    }
    const result = await launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    const uri = result.canceled ? null : result.assets.at(0)?.uri;
    if (uri) await processImage(uri);
  };

  const handleGallery = async () => {
    const permission = await requestMediaLibraryPermissionsAsync();
    if (permission.status !== PermissionStatus.GRANTED) {
      Alert.alert('Permiso necesario', 'Concede acceso a la galería para elegir un documento.');
      return;
    }
    const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const uri = result.canceled ? null : result.assets.at(0)?.uri;
    if (uri) await processImage(uri);
  };

  const handleSave = async () => {
    if (!draft) return;
    setPhase('saving');
    try {
      const amount = draft.amount.trim() ? Number(draft.amount.replace(',', '.')) : null;
      await saveDocument({
        sourceUri: draft.imageUri,
        storeName: draft.storeName.trim() || null,
        amount: amount !== null && !Number.isNaN(amount) ? amount : null,
        date: draft.date.trim() || null,
        rawText: draft.rawText,
      });
      router.back();
    } catch (error) {
      setPhase('review');
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={12}
          disabled={phase === 'saving'}>
          <SymbolView
            tintColor={theme.text}
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={20}
          />
        </Pressable>

        {phase === 'idle' && (
          <ThemedView style={styles.body}>
            <SymbolView
              tintColor={theme.textSecondary}
              name={{ ios: 'camera.viewfinder', android: 'photo_camera', web: 'camera' }}
              size={48}
            />
            <ThemedText type="subtitle" style={styles.centerText}>
              Escanea un documento
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Detectamos automáticamente la tienda, el importe y la fecha. Podrás corregirlos
              antes de guardar.
            </ThemedText>

            <ThemedView style={styles.buttonRow}>
              <Pressable onPress={handleCamera} style={styles.primaryButton}>
                <SymbolView
                  tintColor="#ffffff"
                  name={{ ios: 'camera.fill', android: 'photo_camera', web: 'camera' }}
                  size={18}
                />
                <ThemedText style={styles.primaryButtonText}>Hacer foto</ThemedText>
              </Pressable>
              <Pressable onPress={handleGallery} style={styles.secondaryButton}>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'image' }}
                  size={18}
                />
                <ThemedText style={styles.secondaryButtonText}>Elegir de galería</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        )}

        {phase === 'processing' && (
          <ThemedView style={styles.body}>
            <ActivityIndicator size="large" color={theme.text} />
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              Leyendo el documento…
            </ThemedText>
          </ThemedView>
        )}

        {(phase === 'review' || phase === 'saving') && draft && (
          <ScrollView contentContainerStyle={styles.reviewContent} keyboardShouldPersistTaps="handled">
            <Image source={{ uri: draft.imageUri }} style={styles.preview} />

            <ThemedView style={styles.field}>
              <ThemedText type="smallBold">Tienda</ThemedText>
              <TextInput
                value={draft.storeName}
                onChangeText={(storeName) => setDraft({ ...draft, storeName })}
                placeholder="Nombre de la tienda"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </ThemedView>

            <ThemedView style={styles.field}>
              <ThemedText type="smallBold">Importe (€)</ThemedText>
              <TextInput
                value={draft.amount}
                onChangeText={(amount) => setDraft({ ...draft, amount })}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </ThemedView>

            <ThemedView style={styles.field}>
              <ThemedText type="smallBold">Fecha de caducidad / garantía</ThemedText>
              <TextInput
                value={draft.date}
                onChangeText={(date) => setDraft({ ...draft, date })}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </ThemedView>

            <Pressable
              onPress={handleSave}
              disabled={phase === 'saving'}
              style={[styles.primaryButton, styles.saveButton, phase === 'saving' && styles.disabled]}>
              {phase === 'saving' ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>Guardar</ThemedText>
              )}
            </Pressable>
          </ScrollView>
        )}
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#4f46e5',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  reviewContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  saveButton: {
    marginTop: Spacing.two,
  },
  disabled: {
    opacity: 0.6,
  },
});
