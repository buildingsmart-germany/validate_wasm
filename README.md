# IFC Validation WASM

Eine **WebAssembly-basierte IFC-Validierungsapplikation**, die komplett lokal im Browser läuft - ohne Server-Backend!

## 🚀 Überblick

Diese Applikation bringt die leistungsstarke IFC-Validierungslogik vom [buildingSMART Validation Service](https://github.com/buildingSMART/validate) direkt in Ihren Browser. Durch WebAssembly (WASM) und Pyodide können Sie IFC-Dateien validieren, ohne Daten an externe Server zu senden.

### ✨ Features

- **🔒 Vollständig lokal**: Keine Datenübertragung an Server
- **⚡ WebAssembly-Performance**: Schnelle Validierung mit WASM
- **📱 PWA-fähig**: Installierbar als Progressive Web App
- **🎯 Mehrere Validierungstypen**:
  - STEP-Syntax-Validierung
  - IFC-Header-Validierung
  - Grundlegende Schema-Validierung
  - (Weitere Regeln geplant)
- **💾 Lokaler Speicher**: Validierungshistorie im Browser
- **🌐 Modern UI**: React + Material-UI Interface
- **🔄 Automatische Updates**: Bei Repository-Änderungen

## 🏗️ Architektur

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Web Worker     │    │   Pyodide WASM  │
│   (UI/UX)       │────│   (Coordinator)   │────│   (Python Code) │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          │                       │                       │
          v                       v                       v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ IndexedDB       │    │ Service Worker   │    │ Original Python │
│ (Local Storage) │    │ (PWA/Caching)    │    │ Validation Code │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Tech Stack

- **Frontend**: React 18, Material-UI, Vite
- **WASM Runtime**: Pyodide (Python in Browser)
- **Worker**: Web Workers mit Comlink
- **Build**: Vite, GitHub Actions
- **Deployment**: GitHub Pages, Netlify, Vercel

## 🛠️ Installation & Development

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- Git

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/buildingSMART/validate.git
cd validate/wasm-frontend

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Browser öffnet automatisch http://localhost:5173
```

### Build für Produktion

```bash
# Production Build erstellen
npm run build

# Build testen
npm run preview
```

## 🚢 Deployment

Die Applikation deployed automatisch über GitHub Actions bei Changes am `main` Branch:

### GitHub Pages
- **URL**: `https://[username].github.io/validate/`
- **Setup**: Pages in Repository-Settings aktivieren

### Netlify
- **Setup**: `NETLIFY_AUTH_TOKEN` und `NETLIFY_SITE_ID` als Repository Secrets hinzufügen
- **Domain**: Automatisch generiert oder custom domain

### Vercel
- **Setup**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` als Repository Secrets
- **Domain**: Automatisch generiert oder custom domain

### Manuelle Deployment

```bash
# Build erstellen
npm run build

# Zu einem Static Hosting Service (Netlify, Vercel, etc.) deployen
npm run deploy
```

## 📝 Nutzung

### IFC-Dateien validieren

1. **Öffnen Sie die Applikation** in einem modernen Browser
2. **Warten Sie** bis der WebAssembly Worker initialisiert ist (~10-30 Sekunden)
3. **Laden Sie IFC-Dateien hoch** per Drag & Drop oder File-Picker
4. **Klicken Sie auf "Validieren"** um die Validierung zu starten
5. **Betrachten Sie die Ergebnisse** in der detaillierten Tabelle

### Unterstützte Browser

- ✅ Chrome 87+
- ✅ Firefox 79+
- ✅ Safari 14+
- ✅ Edge 87+

**Hinweis**: WebAssembly und Web Workers sind erforderlich.

## 🔧 Konfiguration

### Environment Variables

```bash
# .env.local
VITE_BUILD_TIME=2024-01-01T00:00:00Z
VITE_COMMIT_HASH=abc123
VITE_BRANCH_NAME=main
VITE_REPOSITORY_URL=https://github.com/buildingSMART/validate
```

### Worker-Konfiguration

Die Validierungslogik läuft in einem Web Worker für bessere Performance:

```javascript
// Worker initialisiert Pyodide
await worker.initialize((progress) => {
  console.log(`Loading: ${progress.stage} - ${progress.progress}%`);
});

// Datei validieren
const result = await worker.validateIFCFile(file, filename);
```

## 🎯 Validierungsregeln

### Aktuell implementiert

- **STEP-Syntax**: Grundlegende IFC-Dateisyntax
- **Header-Validierung**: FILE_DESCRIPTION, FILE_NAME, FILE_SCHEMA
- **Daten-Validierung**: Entity-Struktur und Grundvalidierung

### Geplant

- **EXPRESS Schema**: Vollständige Schema-Validierung
- **Gherkin Rules**: Integration der normativen Regeln
- **bSDD Validation**: buildingSMART Data Dictionary
- **MVD Support**: Model View Definitions

## 🔄 Automatische Updates

Die Applikation aktualisiert sich automatisch bei Repository-Changes:

1. **Code-Änderungen** am Backend werden erkannt
2. **GitHub Actions** startet automatisch Build
3. **Neue Version** wird deployed
4. **Browser** lädt Updates beim nächsten Besuch

### Update-Trigger

- Änderungen in `backend/apps/ifc_validation/`
- Änderungen in `wasm-frontend/`
- Manuelle Workflow-Triggers

## 🤝 Contributing

### Entwicklung erweitern

1. **Fork** das Repository
2. **Erstellen Sie einen Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commiten Sie Ihre Änderungen**: `git commit -m 'Add amazing feature'`
4. **Push zum Branch**: `git push origin feature/amazing-feature`
5. **Öffnen Sie eine Pull Request**

### Neue Validierungsregeln hinzufügen

1. **Backend-Code** in `backend/apps/ifc_validation/` erweitern
2. **Python-Logik** für WASM-Kompatibilität anpassen
3. **Worker-Integration** in `src/workers/ifcValidationWorker.js`
4. **Tests** hinzufügen

## 📊 Performance

### Benchmarks

| Dateigröße | Ladezeit Worker | Validierungszeit | Browser |
|------------|----------------|------------------|---------|
| 1 MB       | ~15s           | ~2s              | Chrome  |
| 10 MB      | ~15s           | ~8s              | Chrome  |
| 50 MB      | ~15s           | ~30s             | Chrome  |

### Optimierungen

- **Code Splitting**: Pyodide lädt nur benötigte Packages
- **Caching**: Service Worker cached WASM Files
- **Compression**: Gzip für alle Assets
- **Preloading**: Kritische Resources werden vorgeladen

## 🐛 Troubleshooting

### Worker initialisiert nicht

```bash
# Browser-Console prüfen
# Häufige Ursachen:
# - Keine HTTPS-Verbindung (für SharedArrayBuffer)
# - Veralteter Browser
# - Fehlende Security Headers
```

### Validierung schlägt fehl

```bash
# Mögliche Ursachen:
# - Ungültiges IFC-Format
# - Datei zu groß (>50MB)
# - Unvollständige Worker-Initialisierung
```

### Performance-Probleme

```bash
# Optimierungen:
# - Kleinere IFC-Dateien verwenden
# - Browser-Cache leeren
# - Chrome DevTools Memory Tab prüfen
```

## 📄 Lizenz

Dieses Projekt steht unter der [MIT License](LICENSE).

## 🙏 Danksagungen

- **buildingSMART International** für die Original-Validierungslogik
- **Pyodide Team** für die Python-WASM-Runtime  
- **React & Material-UI Teams** für die UI-Frameworks

---

**Erstellt mit ❤️ für die AEC-Community**

Für Fragen oder Support öffnen Sie bitte ein [Issue](https://github.com/buildingSMART/validate/issues). 