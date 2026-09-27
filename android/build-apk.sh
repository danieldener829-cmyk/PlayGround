#!/usr/bin/env bash
# Compila o APK do MiniCraft 3D (wrapper WebView do ../index.html).
set -euo pipefail
cd "$(dirname "$0")"

export ANDROID_HOME="${ANDROID_HOME:-/usr/local/lib/android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

# 1) Empacota o jogo atual nos assets (sempre a versão mais recente)
rm -rf app/src/main/assets/www
mkdir -p app/src/main/assets/www
cp ../index.html ../three.module.js app/src/main/assets/www/

# 2) Compila o APK debug (instalável p/ sideload)
# Usa o Gradle 8.10.2 (compatível com AGP 8.5.2; o Gradle do sistema é novo demais)
export GRADLE812=/tmp/gradle95/gradle-8.10.2/bin/gradle
"$GRADLE812" --no-daemon -p . assembleDebug

# 3) Copia o APK final p/ a raiz do projeto
cp app/build/outputs/apk/debug/app-debug.apk ../minicraft-3d.apk
ls -lh ../minicraft-3d.apk
