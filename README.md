# Bóveda de Garantías

App móvil (Expo / React Native, Android) para escanear tickets, facturas y documentos con la
cámara, extraer su texto con OCR y detectar automáticamente tienda, importe y fecha de
caducidad o garantía, para no perder nunca más un ticket ni olvidar cuándo caduca algo.

## Estado

Navegación (Expo Router), escaneo con cámara/galería, OCR (`expo-text-extractor`, ML Kit),
extracción por regex de tienda/importe/fecha (`src/utils/parse-receipt.ts`), bloqueo
biométrico (Face ID / huella) y guardado local cifrado: cada imagen y el índice de documentos
se cifran con AES-256-GCM (`expo-crypto`) antes de tocar disco, con la clave en Keystore vía
`expo-secure-store` (`src/utils/document-store.ts`). Autoactualización desde dentro de la app
vía GitHub Releases (ver abajo).

Todo esto requiere un build de desarrollo/producción (código nativo: OCR, cifrado, biometría,
instalador de APK — no funcionan en Expo Go ni en web): `npx expo run:android`.

## Stack

- [Expo](https://expo.dev) + Expo Router (SDK 57)
- TypeScript
- [expo-text-extractor](https://github.com/pchalupa/expo-text-extractor) para OCR (ML Kit)
- `expo-crypto` (AES-256-GCM) + `expo-secure-store` (Keystore) para el cifrado local
- `expo-local-authentication` para el bloqueo biométrico
- GitHub Actions + GitHub Releases para build, firma y distribución del APK

## Desarrollo

```bash
npm install
npx expo start
```

```bash
npx expo lint      # lint
npx tsc --noEmit    # typecheck
```

## Cómo se actualiza la app

No hay Play Store ni servidor propio: cada push a `master` dispara
[`.github/workflows/release.yml`](.github/workflows/release.yml), que:

1. Genera el proyecto Android (`expo prebuild`) y compila un APK de release firmado con la
   keystore del proyecto (secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` en GitHub Actions — nunca en el repo).
2. Si `expo.version` en `app.json` ha subido respecto a la última release, publica una nueva
   [GitHub Release](../../releases) con el APK adjunto (tag `vX.Y.Z`); si no ha cambiado, no
   crea una release duplicada.

Dentro de la app (`src/hooks/use-github-update.ts`), al abrirla se consulta la API pública de
GitHub (`/releases/latest`, sin token) y se compara la versión publicada con
`Application.nativeApplicationVersion` (la versión realmente instalada), comparando por
segmentos numéricos. Si hay una más reciente, sale el banner para tocar "Actualizar": descarga
el APK y le pide a Android que lo instale encima del actual (el usuario tiene que confirmar el
diálogo del sistema; no hay instalación silenciosa, eso solo lo permite un MDM).

**Por qué esto y no EAS Update:** EAS Update solo puede sustituir el bundle JS, no el icono,
permisos ni nada nativo. Este mecanismo reinstala el APK entero, así que cualquier cambio
—incluido un icono nuevo— llega a través del mismo camino.

**Limitaciones conocidas:**

- Solo Android. iOS no permite instalar apps fuera de la App Store/TestFlight.
- Hay que aceptar una vez el permiso "instalar apps de origen desconocido" para esta app
  (Android lo pide solo la primera vez que hace falta).
- La API de GitHub sin autenticar limita a 60 peticiones/hora por IP; la app solo consulta al
  abrirse, así que no se acerca a ese límite.
- Para subir una versión nueva, sube `expo.version` en `app.json` antes de hacer push a
  `master`.
