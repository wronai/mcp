#!/bin/bash
# install_mcp_builder.sh
# Skrypt instalacyjny dla MCP Project Builder

set -e

echo "╔══════════════════════════════════════════╗"
echo "║     MCP Project Builder Installer        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funkcja do wyświetlania komunikatów
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Sprawdzenie Python 3
check_python() {
    if command -v python3 &>/dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &>/dev/null; then
        PYTHON_VERSION=$(python --version 2>&1 | grep -Po '(?<=Python )\d+')
        if [ "$PYTHON_VERSION" -ge 3 ]; then
            PYTHON_CMD="python"
        else
            log_error "Python 3 jest wymagany!"
            exit 1
        fi
    else
        log_error "Python nie jest zainstalowany!"
        exit 1
    fi
    
    log_info "Python znaleziony: $($PYTHON_CMD --version)"
}

# Instalacja wymaganych pakietów Python
install_requirements() {
    log_info "Instaluję wymagane pakiety Python..."
    
    # Tworzenie requirements.txt
    cat > requirements.txt << 'EOF'
pyyaml>=6.0
pathlib
argparse
EOF
    
    # Instalacja pakietów
    $PYTHON_CMD -m pip install -r requirements.txt --quiet
    
    log_info "Pakiety zainstalowane pomyślnie"
}

# Tworzenie przykładowych plików Markdown
create_example_markdown() {
    log_info "Tworzę przykładowe pliki Markdown..."
    
    mkdir -p markdown-examples
    
    # Przykład 1: Docker Compose
    cat > markdown-examples/docker-setup.md << 'EOF'
# Docker Setup dla MCP Manager

## Konfiguracja Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mcp-manager:
    image: mcp-manager/app:latest
    container_name: mcp-manager
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

## Skrypt instalacyjny

```bash
# scripts/install.sh
#!/bin/bash
echo "Installing MCP Manager..."
docker-compose up -d
echo "Installation complete!"
```
EOF

    # Przykład 2: Konfiguracja serwera
    cat > markdown-examples/server-config.md << 'EOF'
# Konfiguracja Serwerów MCP

## File System Server

```javascript
// services/filesystem/server.js
import { MCPServer } from '@modelcontextprotocol/sdk';

const server = new MCPServer({
  name: 'filesystem-server',
  version: '1.0.0'
});

server.start();
```

## Package.json

```json
// package.json
{
  "name": "mcp-manager",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "test": "jest"
  }
}
```
EOF

    # Przykład 3: Testy E2E
    cat > markdown-examples/e2e-tests.md << 'EOF'
# Testy End-to-End

## Test Suite: Server Management

```typescript
// e2e/tests/server-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('MCP Server Management', () => {
  test('should add new server', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Add Server")');
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

## Playwright Config

```typescript
// e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000'
  }
});
```
EOF

    log_info "Przykładowe pliki Markdown utworzone w: ./markdown-examples/"
}

# Tworzenie skryptu pomocniczego
create_helper_script() {
    log_info "Tworzę skrypt pomocniczy..."
    
    cat > run_builder.sh << 'EOF'
#!/bin/bash
# Helper script dla MCP Project Builder

# Kolory
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 MCP Project Builder${NC}"
echo "========================="
echo ""

# Sprawdź czy podano folder
if [ $# -eq 0 ]; then
    echo "Użycie: ./run_builder.sh <folder_z_markdown> [output_folder]"
    echo ""
    echo "Przykłady:"
    echo "  ./run_builder.sh ./markdown-examples"
    echo "  ./run_builder.sh ./docs ./my-project"
    echo "  ./run_builder.sh . --verbose"
    exit 1
fi

SOURCE_DIR=$1
OUTPUT_DIR=${2:-"./mcp-manager-project"}

# Sprawdź czy folder źródłowy istnieje
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Folder $SOURCE_DIR nie istnieje!"
    exit 1
fi

# Uruchom builder
echo -e "${GREEN}[INFO]${NC} Skanowanie plików Markdown w: $SOURCE_DIR"
echo -e "${GREEN}[INFO]${NC} Projekt zostanie utworzony w: $OUTPUT_DIR"
echo ""

python3 build_project.py "$SOURCE_DIR" --output "$OUTPUT_DIR"

# Jeśli sukces, wyświetl następne kroki
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Sukces!${NC}"
    echo ""
    echo "Następne kroki:"
    echo "1. cd $OUTPUT_DIR"
    echo "2. make install    # Zainstaluj zależności"
    echo "3. make start      # Uruchom aplikację"
    echo ""
    echo "Lub użyj:"
    echo "  make help        # Zobacz wszystkie dostępne komendy"
fi
EOF

    chmod +x run_builder.sh
    log_info "Skrypt pomocniczy utworzony: ./run_builder.sh"
}

# Tworzenie README z instrukcją
create_readme() {
    log_info "Tworzę instrukcję README..."
    
    cat > README_BUILDER.md << 'EOF'
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
EOF

    log_info "README utworzone: ./README_BUILDER.md"
}

# Główna funkcja
main() {
    echo ""
    log_info "Rozpoczynam instalację MCP Project Builder..."
    echo ""
    
    # Sprawdzenie Python
    check_python
    
    # Instalacja wymagań
    install_requirements
    
    # Tworzenie przykładów
    create_example_markdown
    
    # Tworzenie skryptu pomocniczego
    create_helper_script
    
    # Tworzenie README
    create_readme
    
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║     ✅ INSTALACJA ZAKOŃCZONA!            ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""
    echo "📚 Instrukcja użycia:"
    echo "   1. Umieść pliki Markdown w folderze"
    echo "   2. Uruchom: ./run_builder.sh <folder>"
    echo ""
    echo "📁 Przykładowe pliki Markdown:"
    echo "   ./markdown-examples/"
    echo ""
    echo "🚀 Szybki test:"
    echo "   ./run_builder.sh ./markdown-examples"
    echo ""
    echo "📖 Dokumentacja:"
    echo "   cat README_BUILDER.md"
    echo ""
}

# Uruchom główną funkcję
main