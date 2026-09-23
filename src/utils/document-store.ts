import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/** La API de archivos nuevos (Directory/File) no está implementada en web: https://docs.expo.dev/versions/latest/sdk/filesystem/ */
const isFileSystemSupported = Platform.OS !== 'web';

export interface StoredDocument {
  id: string;
  imageUri: string;
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

const INDEX_FILE_NAME = 'index.json';

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

function readIndex(): StoredDocument[] {
  if (!isFileSystemSupported) return [];
  const file = getIndexFile();
  if (!file.exists) return [];
  try {
    return JSON.parse(file.textSync()) as StoredDocument[];
  } catch {
    return [];
  }
}

function writeIndex(documents: StoredDocument[]): void {
  getIndexFile().write(JSON.stringify(documents));
}

function generateDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveDocument(params: SaveDocumentParams): Promise<StoredDocument> {
  if (!isFileSystemSupported) {
    throw new Error('Guardar documentos no está disponible en web, usa la app móvil.');
  }
  const directory = getDocumentsDirectory();
  const id = generateDocumentId();
  const extension = params.sourceUri.includes('.') ? params.sourceUri.split('.').pop() : 'jpg';

  const sourceFile = new File(params.sourceUri);
  const destinationFile = new File(directory, `${id}.${extension}`);
  await sourceFile.copy(destinationFile, { overwrite: true });

  const document: StoredDocument = {
    id,
    imageUri: destinationFile.uri,
    storeName: params.storeName,
    amount: params.amount,
    date: params.date,
    rawText: params.rawText,
    createdAt: new Date().toISOString(),
  };

  const documents = readIndex();
  documents.unshift(document);
  writeIndex(documents);

  return document;
}

export function getDocuments(): StoredDocument[] {
  return readIndex();
}

export function getDocument(id: string): StoredDocument | null {
  return readIndex().find((document) => document.id === id) ?? null;
}

export function deleteDocument(id: string): void {
  const documents = readIndex();
  const document = documents.find((doc) => doc.id === id);
  if (!document) return;

  const file = new File(document.imageUri);
  if (file.exists) file.delete();

  writeIndex(documents.filter((doc) => doc.id !== id));
}
