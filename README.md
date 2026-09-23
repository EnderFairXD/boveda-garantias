# Bóveda de Garantías

App móvil (Expo / React Native) para escanear tickets, facturas y documentos con la cámara,
extraer su texto con OCR y detectar automáticamente tienda, importe y fecha de caducidad o
garantía, para no perder nunca más un ticket ni olvidar cuándo caduca algo.

## Estado

Fase de esqueleto: navegación (Expo Router), pantalla de documentos, pantalla de ajustes,
modal de escaneo (placeholder) y aviso de actualización OTA ya funcionando. OCR, NLP para
fechas/importes y cifrado local llegan en siguientes iteraciones.

## Stack

- [Expo](https://expo.dev) + Expo Router (SDK 57)
- TypeScript
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
