import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDocuments, type StoredDocument } from '@/utils/document-store';

const currencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function DateBadge({ date }: { date: string | null }) {
  if (!date) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Sin fecha detectada
      </ThemedText>
    );
  }

  const diff = daysUntil(date);
  const color = diff < 0 ? '#dc2626' : diff <= 30 ? '#d97706' : undefined;
  const label = diff < 0 ? `Caducó el ${date}` : diff === 0 ? 'Caduca hoy' : `Caduca el ${date}`;

  return (
    <ThemedText type="small" style={color ? { color } : undefined} themeColor={color ? undefined : 'textSecondary'}>
      {label}
    </ThemedText>
  );
}

function DocumentCard({ document }: { document: StoredDocument }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/document/[id]', params: { id: document.id } })}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <Image source={{ uri: document.imageUri }} style={styles.thumbnail} />
        <ThemedView style={styles.cardBody}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {document.storeName ?? 'Sin nombre'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {document.amount !== null ? currencyFormatter.format(document.amount) : 'Sin importe'}
          </ThemedText>
          <DateBadge date={document.date} />
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

export default function DocumentsScreen() {
  const theme = useTheme();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);

  useFocusEffect(
    useCallback(() => {
      setDocuments(getDocuments());
    }, []),
  );

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

        {documents.length === 0 ? (
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
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(document) => document.id}
            renderItem={({ item }) => <DocumentCard document={item} />}
            contentContainerStyle={styles.list}
            style={styles.listWrapper}
          />
        )}

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
  listWrapper: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
  },
  cardBody: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
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
