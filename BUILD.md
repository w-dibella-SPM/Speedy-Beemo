# Come buildare il progetto
### Esegui `build.sh`.

---

### Oppure esegui i seguenti comandi da terminale
- Compila il progetto

```bash
npm run build
```

- Crea le cartelle necessarie
```bash
mkdir SpeedyBeemo SpeedyBeemo/app SpeedyBeemo/runtime
```

- Copia i file necessari nelle cartelle
```bash
cp README.md SpeedyBeemo
cp -r dist package.json package-lock.json SpeedyBeemo/app
```

- Installa la versione portable di [NodeJS per Windows](https://nodejs.org/en/download) e incolla il contenuto della cartella in `SpeedyBeemo/runtime`.

- Crea il file `SpeedyBeemo.bat`
```bash
touch SpeedyBeemo/SpeedyBeemo.bat
```
- Incolla il seguente codice nel file
```batch
@echo off

cd app
if not exist node_modules\ (
	echo "Installazione delle dipendenze in corso..."
	call ..\runtime\npm install
	echo "Installazione completata!"
)
cd ..
.\runtime\node.exe .\app\dist\main.js
pause
```

- Vai su Windows e avvia `SpeedyBeemo.bat`
- Fatto!

# Deploy
### Push con tag `vX.X.X`:

---
Per creare una release, è sufficiente creare un commit con un tag `vX.X.X`, dove X corrisponde con il numero della versione.