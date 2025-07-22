# Build-Probleme beheben

## ✅ Gelöste Probleme

### 1. vite-plugin-pwa Fehler
**Problem**: `Unknown feature name 'webassembly'`
**Lösung**: browserslist-Konfiguration korrigiert

### 2. node-fetch Import Fehler (NEW!)
**Problem**: `Failed to resolve import "node-fetch" from "node_modules/pyodide/pyodide.mjs"`
**Ursache**: Pyodide npm-Package versucht Node.js-Module im Browser zu laden

**Lösung**: 
- Pyodide über CDN laden anstatt npm
- `importScripts()` im Web Worker verwenden
- npm-Dependency entfernt

### Durchgeführte Änderungen

1. **Worker-Code aktualisiert**:
   - Pyodide wird jetzt über CDN geladen
   - `importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js')`
   - Bessere Fehlerbehandlung

2. **package.json bereinigt**:
   - `pyodide` Dependency entfernt
   - Nur noch Comlink für Worker-Kommunikation

3. **Vite-Konfiguration optimiert**:
   - CDN-Caching für Pyodide konfiguriert
   - Chunk-Splitting angepasst

## 🚀 Jetzt testen

```bash
# Dependencies neu installieren (pyodide wurde entfernt)
rm -rf node_modules package-lock.json
npm install

# Development Server
npm run dev

# Build 
npm run build
```

## ✅ Erwartetes Verhalten

1. **Development Server** startet ohne Fehler
2. **Browser** lädt die App
3. **Worker** initialisiert Pyodide über CDN (15-30s)
4. **Validierung** funktioniert lokal

## 🔧 Weitere mögliche Fixes

### Falls immer noch Probleme auftreten

**Option 1: Cache leeren**
```bash
# Vite Cache leeren
rm -rf node_modules/.vite
rm -rf dist

# Neu bauen
npm run build
```

**Option 2: Browser Cache leeren**
- Hard Refresh: Ctrl+Shift+R (Windows/Linux) oder Cmd+Shift+R (Mac)
- DevTools → Application → Storage → Clear storage

**Option 3: Alternative Pyodide Version**
```javascript
// In ifcValidationWorker.js, andere Version testen:
importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
```

## 📊 Performance Hinweise

### CDN vs NPM
- ✅ **CDN**: Keine node-fetch Probleme, besseres Caching
- ✅ **Erste Ladezeit**: ~15-30 Sekunden (Pyodide Download)
- ✅ **Folgende Ladevorgänge**: ~2-5 Sekunden (Browser Cache)

### Browser-Kompatibilität
- ✅ Chrome 87+ (empfohlen)
- ✅ Firefox 79+
- ⚠️ Safari 14+ (langsamer)
- ✅ Edge 87+

## 🎯 Status Check

Nach diesen Fixes sollten funktionieren:

```bash
npm install     # ✅ Ohne Pyodide-Konflikte  
npm run dev     # ✅ Ohne node-fetch Fehler
npm run build   # ✅ Ohne browserslist Fehler
```

## 🚀 Deployment

Nach erfolgreichem lokalen Test:

```bash
git add .
git commit -m "Fix node-fetch and CDN loading issues"
git push origin main
```

Automatisches Deployment sollte nun funktionieren! 