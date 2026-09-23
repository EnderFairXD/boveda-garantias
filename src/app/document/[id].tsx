import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { deleteDocument, getDocument, getDocumentImageUri, type StoredDocument } from '@/utils/document-store';

const currencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ignore = false;

      (async () => {
        setLoading(true);
        const [found, uri] = await Promise.all([getDocument(id), getDocumentImageUri(id)]);
        if (!ignore) {
          setDocument(found);
          setImageUri(uri);
          setLoading(false);
        }
      })();

      return () => {
        ignore = true;
      };
    }, [id]),
  );

  const handleDelete = () => {
    Alert.alert('Eliminar documento', '¿Seguro que quieres eliminarlo? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteDocument(id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Documento' }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!document) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Documento' }} />
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary">Este documento ya no existe.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: document.storeName ?? 'Documento' }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

          <ThemedView type="backgroundElement" style={styles.detailsCard}>
            <DetailRow label="Tienda" value={document.storeName ?? 'Sin nombre'} />
            <DetailRow
              label="Importe"
              value={document.amount !== null ? currencyFormatter.format(document.amount) : 'Sin importe'}
            />
            <DetailRow label="Fecha de caducidad / garantía" value={document.date ?? 'Sin fecha detectada'} />
            <DetailRow
              label="Guardado el"
              value={new Date(document.createdAt).toLocaleDateString('es-ES')}
            />
          </ThemedView>

          {document.rawText.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.rawTextCard}>
              <ThemedText type="smallBold">Texto detectado</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {document.rawText}
              </ThemedText>
            </ThemedView>
          )}

          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <SymbolView tintColor="#dc2626" name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} />
            <ThemedText style={styles.deleteButtonText}>Eliminar documento</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
  },
  detailsCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  rawTextCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#dc2626',
    marginTop: Spacing.two,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '700',
  },
});
