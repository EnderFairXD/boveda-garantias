# Bóveda de Garantías

App móvil (Expo / React Native) para escanear tickets, facturas y documentos con la cámara,
extraer su texto con OCR y detectar automáticamente tienda, importe y fecha de caducidad o
garantía, para no perder nunca más un ticket ni olvidar cuándo caduca algo.

## Estado

Navegación (Expo Router), aviso de actualización OTA, escaneo con cámara/galería, OCR
(`expo-text-extractor`, ML Kit en Android / Vision en iOS), extracción por regex de
tienda/importe/fecha (`src/utils/parse-receipt.ts`), bloqueo biométrico (Face ID / huella)
y guardado local cifrado: cada imagen y el índice de documentos se cifran con AES-256-GCM
(`expo-crypto`) antes de tocar disco, con la clave en Keychain/Keystore vía
`expo-secure-store` (`src/utils/document-store.ts`).

Todo esto requiere un build de desarrollo (código nativo: OCR, cifrado, biometría — no
funcionan en Expo Go ni en web): `npx expo run:android` / `npx expo run:ios`, o
`eas build --profile development`.

## Stack

- [Expo](https://expo.dev) + Expo Router (SDK 57)
- TypeScript
- [expo-text-extractor](https://github.com/pchalupa/expo-text-extractor) para OCR (ML Kit / Vision)
- `expo-crypto` (AES-256-GCM) + `expo-secure-store` (Keychain/Keystore) para el cifrado local
- `expo-local-authentication` para el bloqueo biométrico
- EAS Build / EAS Update para actualizaciones OTA

## Desarrollo

```bash
npm install
npx expo start
```

```bash
npx expo lint      # lint
npx tsc --noEmit    # typecheck
```

## Publicar una actualización OTA

```bash
npx eas-cli@latest update --branch production --message "..."
```

Al abrir la app, si hay una actualización publicada se muestra un aviso para que el usuario
decida cuándo aplicarla (no se instala en silencio).
