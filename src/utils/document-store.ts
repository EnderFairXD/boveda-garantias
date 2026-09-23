import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** El almacenamiento cifrado depende de Directory/File y SecureStore, que no están
 * implementados en web: https://docs.expo.dev/versions/latest/sdk/filesystem/ */
const isNativeStorageSupported = Platform.OS !== 'web';

export interface StoredDocument {
  id: string;
  storeName: string | null;
  amount: number | null;
  /** Fecha de caducidad/garantía detectada o corregida por el usuario, ISO yyyy-mm-dd. */
  date: string | null;
  rawText: string;
  createdAt: string;
}

export interface SaveDocumentParams {
  sourceUri: string;
  storeName: string | null;
  amount: number | null;
  date: string | null;
  rawText: string;
}

const ENCRYPTION_KEY_STORAGE_KEY = 'boveda_garantias_aes_key';
const INDEX_FILE_NAME = 'index.enc';

/** UTF-8 seguro: btoa/atob solo operan sobre Latin1, y los tickets llevan tildes y "€". */
function utf8ToBase64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function base64ToUtf8(value: string): string {
  return decodeURIComponent(escape(atob(value)));
}

let cachedKeyPromise: Promise<AESEncryptionKey> | null = null;

/** Clave AES-256 guardada en Keychain (iOS) / Keystore (Android) vía SecureStore.
 * Se genera una sola vez por instalación; nunca sale del almacén seguro del sistema. */
function getEncryptionKey(): Promise<AESEncryptionKey> {
  if (!cachedKeyPromise) {
    cachedKeyPromise = (async () => {
      const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
      if (existing) {
        return AESEncryptionKey.import(existing, 'hex');
      }
      const key = await AESEncryptionKey.generate();
      const hex = await key.encoded('hex');
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, hex);
      return key;
    })();
  }
  return cachedKeyPromise;
}

function getDocumentsDirectory(): Directory {
  const directory = new Directory(Paths.document, 'boveda-garantias');
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

function getIndexFile(): File {
  return new File(getDocumentsDirectory(), INDEX_FILE_NAME);
}

function getImageFile(id: string): File {
  return new File(getDocumentsDirectory(), `${id}.enc`);
}

async function readIndex(): Promise<StoredDocument[]> {
  if (!isNativeStorageSupported) return [];
  const file = getIndexFile();
  if (!file.exists) return [];

  try {
    const key = await getEncryptionKey();
    const combined = await file.bytes();
    const sealed = AESSealedData.fromCombined(combined);
    const plaintextBase64 = await aesDecryptAsync(sealed, key, { output: 'base64' });
    return JSON.parse(base64ToUtf8(plaintextBase64 as string)) as StoredDocument[];
  } catch {
    return [];
  }
}

async function writeIndex(documents: StoredDocument[]): Promise<void> {
  const key = await getEncryptionKey();
  const plaintextBase64 = utf8ToBase64(JSON.stringify(documents));
  const sealed = await aesEncryptAsync(plaintextBase64, key);
  const combined = await sealed.combined();

  const file = getIndexFile();
  file.create({ overwrite: true });
  file.write(combined);
}

function generateDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveDocument(params: SaveDocumentParams): Promise<StoredDocument> {
  if (!isNativeStorageSupported) {
    throw new Error('Guardar documentos no está disponible en web, usa la app móvil.');
  }

  const id = generateDocumentId();
  const key = await getEncryptionKey();

  const sourceFile = new File(params.sourceUri);
  const imageBytes = await sourceFile.bytes();
  const sealedImage = await aesEncryptAsync(imageBytes, key);
  const combinedImage = await sealedImage.combined();

  const imageFile = getImageFile(id);
  imageFile.create({ overwrite: true });
  imageFile.write(combinedImage);

  const document: StoredDocument = {
    id,
    storeName: params.storeName,
    amount: params.amount,
    date: params.date,
    rawText: params.rawText,
    createdAt: new Date().toISOString(),
  };

  const documents = await readIndex();
  documents.unshift(document);
  await writeIndex(documents);

  return document;
}

export async function getDocuments(): Promise<StoredDocument[]> {
  return readIndex();
}

export async function getDocument(id: string): Promise<StoredDocument | null> {
  const documents = await readIndex();
  return documents.find((document) => document.id === id) ?? null;
}

/** Descifra la imagen de un documento y la devuelve como data URI, lista para <Image>. */
export async function getDocumentImageUri(id: string): Promise<string | null> {
  if (!isNativeStorageSupported) return null;

  const file = getImageFile(id);
  if (!file.exists) return null;

  const key = await getEncryptionKey();
  const combined = await file.bytes();
  const sealed = AESSealedData.fromCombined(combined);
  const base64 = await aesDecryptAsync(sealed, key, { output: 'base64' });
  return `data:image/jpeg;base64,${base64}`;
}

export async function deleteDocument(id: string): Promise<void> {
  const documents = await readIndex();
  if (!documents.some((document) => document.id === id)) return;

  const imageFile = getImageFile(id);
  if (imageFile.exists) imageFile.delete();

  await writeIndex(documents.filter((document) => document.id !== id));
}
