# 🏗️ MCP Project Builder

Automatyczny generator struktury projektu MCP Manager z plików Markdown.

## 🚀 Quick Start

### 1. Instalacja

```bash
# Uruchom skrypt instalacyjny
./install_mcp_builder.sh

# Lub ręcznie zainstaluj wymagania
pip install pyyaml
```

### 2. Przygotowanie plików Markdown

Umieść swoje pliki Markdown w folderze. Skrypt rozpoznaje następujące formaty:

#### Format dla plików kodu:
```markdown
\```javascript
// services/example/server.js
const code = "your code here";
\```
```

#### Format dla plików konfiguracyjnych:
```markdown
\```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: app:latest
\```
```

### 3. Uruchomienie buildera

```bash
# Podstawowe użycie
python3 build_project.py ./folder-z-markdown

# Z określeniem folderu docelowego
python3 build_project.py ./docs --output ./my-project

# Lub użyj skryptu pomocniczego
./run_builder.sh ./markdown-examples
```

## 📁 Struktura wyjściowa

Builder utworzy następującą strukturę:

```
mcp-manager-project/
├── services/           # Serwery MCP
├── monitoring/         # Konfiguracja Prometheus/Grafana
├── tests/             # Testy E2E
├── scripts/           # Skrypty pomocnicze
├── config/            # Pliki konfiguracyjne
├── docs/              # Dokumentacja
├── docker-compose.yml # Główny plik Docker Compose
├── Makefile          # Komendy make
├── README.md         # Dokumentacja projektu
└── .gitignore        # Git ignore

```

## 🎯 Funkcje

- ✅ Automatyczne rozpoznawanie bloków kodu
- ✅ Tworzenie struktury katalogów
- ✅ Generowanie Makefile
- ✅ Tworzenie README i .gitignore
- ✅ Ustawianie uprawnień dla skryptów
- ✅ Formatowanie JSON i YAML
- ✅ Raport z budowania

## 📝 Wspierane formaty

### Języki programowania:
- JavaScript/TypeScript (`*.js`, `*.ts`, `*.jsx`, `*.tsx`)
- Python (`*.py`)
- Bash/Shell (`*.sh`)
- Go (`*.go`)
- Rust (`*.rs`)

### Pliki konfiguracyjne:
- Docker (`Dockerfile`, `docker-compose.yml`)
- YAML (`*.yml`, `*.yaml`)
- JSON (`*.json`)
- Environment (`*.env`)
- Makefile

### Dokumentacja:
- Markdown (`*.md`)
- README files

## 🔧 Opcje zaawansowane

```bash
# Tryb verbose (więcej informacji)
python3 build_project.py ./docs --verbose

# Dry run (tylko analiza, bez tworzenia plików)
python3 build_project.py ./docs --dry-run

# Pomoc
python3 build_project.py --help
```

## 🐛 Rozwiązywanie problemów

### Problem: "Python nie znaleziony"
```bash
# Ubuntu/Debian
sudo apt-get install python3 python3-pip

# macOS
brew install python3

# Windows
# Pobierz z https://www.python.org/downloads/
```

### Problem: "Brak modułu yaml"
```bash
pip3 install pyyaml
```

### Problem: "Permission denied"
```bash
chmod +x build_project.py
chmod +x run_builder.sh
```

## 📊 Przykład wyniku

Po uruchomieniu zobaczysz:

```
╔══════════════════════════════════════╗
║     🎉 BUDOWANIE ZAKOŃCZONE! 🎉      ║
╚══════════════════════════════════════╝

📊 Statystyki:
├─ Pliki Markdown przetworzone: 3
├─ Pliki utworzone: 25
├─ Katalogi utworzone: 8
└─ Błędy: 0

📂 Struktura projektu utworzona w:
   ./mcp-manager-project

🚀 Następne kroki:
   1. cd ./mcp-manager-project
   2. cp .env.example .env
   3. make install
   4. make start
```

## 💡 Tips & Tricks

1. **Organizuj pliki Markdown** według kategorii (services, tests, config)
2. **Używaj komentarzy** na początku bloków kodu ze ścieżką pliku
3. **Sprawdź wynik** przed deploymentem: `make validate`
4. **Backup** swojej konfiguracji: `make backup`

## 🤝 Wsparcie

Jeśli masz problemy:
1. Sprawdź logi w `BUILD_REPORT.txt`
2. Uruchom z flagą `--verbose` dla więcej informacji
3. Upewnij się, że format bloków kodu jest poprawny

## 📄 Licencja

MIT License

---

*Zbudowane z ❤️ dla społeczności MCP*
