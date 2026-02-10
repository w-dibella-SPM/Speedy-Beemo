#!/bin/bash

APPLICATION_NAME="SpeedyBeemo"
PRODUCTION_DIR="SpeedyBeemo"
RUNTIME_DIR="$PRODUCTION_DIR/runtime"
APP_DIR="$PRODUCTION_DIR/app"

NODE_BASE_URL="https://nodejs.org/dist"
NODE_DIST_LATEST_URL="https://nodejs.org/dist/latest"
NODE_VERSION=$(
  curl -s "$NODE_DIST_LATEST_URL/" \
  | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' \
  | head -n 1
)
NODE_ZIP="node-$NODE_VERSION-win-x64.zip"

create_bat() {
APP_DIR_RELATIVE_PATH="${APP_DIR#"$PRODUCTION_DIR"/}"
RUNTIME_DIR_RELATIVE_PATH="${RUNTIME_DIR#"$PRODUCTION_DIR"/}"

cat > "$PRODUCTION_DIR/$APPLICATION_NAME.bat" << EOF
@echo off

cd $APP_DIR_RELATIVE_PATH
if not exist node_modules\ (
    echo "Installazione delle dipendenze in corso..."
    call ..\\$RUNTIME_DIR_RELATIVE_PATH\npm install
    echo "Installazione completata!"
)
cd ..
.\\$RUNTIME_DIR_RELATIVE_PATH\node.exe .\\$APP_DIR_RELATIVE_PATH\dist\main.js
pause
EOF
}

main() {
  # Build del progetto
  npm run build

  # Crea la cartella da distribuire (se non esiste)
  mkdir -p "$PRODUCTION_DIR"

  rm -rf "$RUNTIME_DIR"
  rm -rf "$APP_DIR"

  mkdir "$RUNTIME_DIR"
  mkdir "$APP_DIR"

  cp README.md "$PRODUCTION_DIR"
  cp -r dist package.json package-lock.json "$PRODUCTION_DIR/app"

  # Scarica il runtime (ultima versione di NodeJS disponibile)
  echo "Downloading NodeJS from \"$NODE_BASE_URL/$NODE_VERSION/$NODE_ZIP\"..."
  curl -fLO "$NODE_BASE_URL/$NODE_VERSION/$NODE_ZIP"

  # Unzip del file scaricato
  NODE_ZIP_DEST_DIR="${NODE_ZIP%.zip}"
  rm "$NODE_ZIP_DEST_DIR"
  unzip "$NODE_ZIP"

  if [ ! -d "$NODE_ZIP_DEST_DIR" ]; then
    echo "Node zip not extracted"
    exit 1
  fi

  # Sposta anche i file che iniziano con "."
  shopt -s dotglob
  mv "$NODE_ZIP_DEST_DIR"/* "$RUNTIME_DIR"
  shopt -u dotglob

  # Rimuovi lo zip scaricato e la cartella in cui è stato estratto
  rm -r "$NODE_ZIP_DEST_DIR"
  rm "$NODE_ZIP"

  # Crea il file bat per avviare l'applicativo
  create_bat

  # Zip della cartella da distribuire
  zip -r "$APPLICATION_NAME.zip" "$PRODUCTION_DIR"
#  rm -rf "$PRODUCTION_DIR"

  echo "Build done!"
}

main
