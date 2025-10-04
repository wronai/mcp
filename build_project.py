#!/usr/bin/env python3
"""
MCP Project Builder
Automatycznie generuje strukturę projektu z plików Markdown
Użycie: python build_project.py <folder_z_markdown> [--output <folder_docelowy>]
"""

import os
import re
import sys
import argparse
import json
import yaml
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ProjectBuilder:
    """Klasa do budowania struktury projektu z plików Markdown"""
    
    def __init__(self, source_dir: str, output_dir: str = None):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir) if output_dir else Path.cwd() / "mcp-manager-project"
        self.files_created = []
        self.dirs_created = []
        self.stats = {
            'files_processed': 0,
            'files_created': 0,
            'dirs_created': 0,
            'errors': 0
        }
        
    def scan_markdown_files(self) -> List[Path]:
        """Skanuje folder w poszukiwaniu plików Markdown"""
        markdown_files = []
        extensions = ['.md', '.markdown']
        
        for ext in extensions:
            markdown_files.extend(self.source_dir.rglob(f'*{ext}'))
        
        logger.info(f"Znaleziono {len(markdown_files)} plików Markdown")
        return markdown_files
    
    def extract_code_blocks(self, content: str) -> List[Dict]:
        """Wyodrębnia bloki kodu z pliku Markdown"""
        code_blocks = []
        
        # Wzorce dla różnych formatów bloków kodu
        patterns = [
            # Format: ```language\n# path/to/file.ext\ncode```
            r'```(\w+)\s*\n#\s*([^\n]+)\s*\n(.*?)```',
            # Format: ```language\n// path/to/file.ext\ncode```
            r'```(\w+)\s*\n//\s*([^\n]+)\s*\n(.*?)```',
            # Format: ```yaml\n# path/to/file.yml\ncode```
            r'```(yaml|yml)\s*\n#\s*([^\n]+\.ya?ml)\s*\n(.*?)```',
            # Format dla plików konfiguracyjnych z komentarzem
            r'```(\w+)\s*\n#\s*(\S+/[^\n]+)\s*\n(.*?)```',
            # Format dla JavaScript/TypeScript
            r'```(javascript|typescript|js|ts)\s*\n//\s*([^\n]+\.[jt]sx?)\s*\n(.*?)```',
            # Format dla Pythona
            r'```python\s*\n#\s*([^\n]+\.py)\s*\n(.*?)```',
            # Format dla bash/shell
            r'```(?:bash|sh|shell)\s*\n#(?:!/bin/bash\s*)?\s*\n#\s*([^\n]+\.sh)\s*\n(.*?)```',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, content, re.DOTALL | re.MULTILINE)
            for match in matches:
                if len(match.groups()) == 3:
                    language, filepath, code = match.groups()
                else:
                    language = match.group(1) if len(match.groups()) >= 1 else 'text'
                    filepath = match.group(2) if len(match.groups()) >= 2 else match.group(1)
                    code = match.group(3) if len(match.groups()) >= 3 else match.group(2)
                
                # Czyszczenie ścieżki
                filepath = filepath.strip()
                if filepath.startswith('./'):
                    filepath = filepath[2:]
                
                # Pomijamy bloki bez określonej ścieżki pliku
                if '/' in filepath or '.' in filepath:
                    code_blocks.append({
                        'language': language,
                        'filepath': filepath,
                        'code': code.strip()
                    })
        
        # Specjalne przetwarzanie dla docker-compose i innych plików YAML
        yaml_pattern = r'```yaml\s*\n(.*?)```'
        yaml_matches = re.finditer(yaml_pattern, content, re.DOTALL)
        
        for match in yaml_matches:
            code = match.group(1)
            # Szukamy komentarzy ze ścieżką w pierwszych liniach
            lines = code.split('\n')
            if lines and lines[0].startswith('#'):
                filepath_match = re.match(r'#\s*(.+\.(yml|yaml|json|env|sh|js|ts|py|md))', lines[0])
                if filepath_match:
                    filepath = filepath_match.group(1).strip()
                    actual_code = '\n'.join(lines[1:]).strip()
                    code_blocks.append({
                        'language': 'yaml',
                        'filepath': filepath,
                        'code': actual_code
                    })
        
        return code_blocks
    
    def extract_file_definitions(self, content: str) -> List[Dict]:
        """Wyodrębnia definicje plików z różnych formatów w Markdown"""
        files = []
        
        # Dodatkowe wzorce dla specyficznych przypadków
        special_patterns = [
            # Format: ### Plik: path/to/file.ext
            r'###?\s*(?:Plik|File|Config|Configuration):\s*`?([^\n`]+)`?\s*\n```(\w+)\s*\n(.*?)```',
            # Format dla package.json i innych JSON-ów
            r'```json\s*\n(?://|#)?\s*([^\n]+\.json)\s*\n(.*?)```',
            # Format dla .env
            r'```(?:bash|text|env)\s*\n#\s*([^\n]*\.env(?:\.\w+)?)\s*\n(.*?)```',
            # Format dla Dockerfile
            r'```dockerfile\s*\n#\s*([^\n]*Dockerfile[^\n]*)\s*\n(.*?)```',
        ]
        
        for pattern in special_patterns:
            matches = re.finditer(pattern, content, re.DOTALL | re.MULTILINE)
            for match in matches:
                if len(match.groups()) == 3:
                    filepath, language, code = match.groups()
                else:
                    filepath = match.group(1)
                    code = match.group(2) if len(match.groups()) > 1 else ''
                    language = 'text'
                
                filepath = filepath.strip()
                if filepath and not filepath.startswith('#'):
                    files.append({
                        'language': language,
                        'filepath': filepath,
                        'code': code.strip()
                    })
        
        # Wyodrębnianie zwykłych bloków kodu
        code_blocks = self.extract_code_blocks(content)
        files.extend(code_blocks)
        
        # Usuwanie duplikatów
        seen = set()
        unique_files = []
        for file_def in files:
            filepath = file_def['filepath']
            if filepath not in seen:
                seen.add(filepath)
                unique_files.append(file_def)
        
        return unique_files
    
    def create_file_structure(self, file_definitions: List[Dict]):
        """Tworzy strukturę plików i katalogów"""
        for file_def in file_definitions:
            filepath = file_def['filepath']
            code = file_def['code']
            language = file_def['language']
            
            # Pełna ścieżka do pliku
            full_path = self.output_dir / filepath
            
            try:
                # Tworzenie katalogów
                full_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Śledzenie utworzonych katalogów
                if str(full_path.parent) not in self.dirs_created:
                    self.dirs_created.append(str(full_path.parent))
                    self.stats['dirs_created'] += 1
                
                # Określanie trybu zapisu na podstawie typu pliku
                mode = 'w'
                encoding = 'utf-8'
                
                # Specjalne przetwarzanie dla różnych typów plików
                content = self.process_file_content(code, language, filepath)
                
                # Zapisywanie pliku
                with open(full_path, mode, encoding=encoding) as f:
                    f.write(content)
                
                # Ustawianie uprawnień dla skryptów
                if filepath.endswith('.sh') or 'bin/' in filepath:
                    os.chmod(full_path, 0o755)
                
                self.files_created.append(str(full_path))
                self.stats['files_created'] += 1
                logger.info(f"✅ Utworzono: {filepath}")
                
            except Exception as e:
                self.stats['errors'] += 1
                logger.error(f"❌ Błąd przy tworzeniu {filepath}: {e}")
    
    def process_file_content(self, code: str, language: str, filepath: str) -> str:
        """Przetwarza zawartość pliku przed zapisaniem"""
        content = code
        
        # Dodanie shebang dla skryptów
        if filepath.endswith('.sh') and not code.startswith('#!'):
            content = '#!/bin/bash\n\n' + code
        elif filepath.endswith('.py') and not code.startswith('#!'):
            content = '#!/usr/bin/env python3\n\n' + code
        
        # Formatowanie JSON
        if filepath.endswith('.json'):
            try:
                json_data = json.loads(code)
                content = json.dumps(json_data, indent=2)
            except:
                pass  # Jeśli nie można sparsować, zostawiamy jak jest
        
        # Formatowanie YAML
        if filepath.endswith(('.yml', '.yaml')):
            # Usuwanie ewentualnych podwójnych komentarzy
            lines = content.split('\n')
            cleaned_lines = []
            for line in lines:
                if line.strip().startswith('##'):
                    cleaned_lines.append(line[1:])
                else:
                    cleaned_lines.append(line)
            content = '\n'.join(cleaned_lines)
        
        return content
    
    def create_project_structure(self):
        """Tworzy kompletną strukturę projektu"""
        # Podstawowe katalogi projektu
        base_dirs = [
            'services',
            'monitoring',
            'tests',
            'scripts',
            'config',
            'docs',
            '.github/workflows'
        ]
        
        for dir_path in base_dirs:
            full_path = self.output_dir / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"📁 Utworzono katalog: {dir_path}")
        
        # Tworzenie pliku README jeśli nie istnieje
        readme_path = self.output_dir / 'README.md'
        if not readme_path.exists():
            with open(readme_path, 'w') as f:
                f.write(self.generate_readme())
            logger.info("📝 Utworzono README.md")
        
        # Tworzenie .gitignore
        gitignore_path = self.output_dir / '.gitignore'
        if not gitignore_path.exists():
            with open(gitignore_path, 'w') as f:
                f.write(self.generate_gitignore())
            logger.info("📝 Utworzono .gitignore")
    
    def generate_readme(self) -> str:
        """Generuje zawartość pliku README"""
        return """# MCP Manager Project

## 🚀 Quick Start

```bash
# Instalacja
./scripts/setup-mcp.sh

# Uruchomienie
docker-compose up -d

# Dostęp do aplikacji
http://localhost:3000
```

## 📁 Struktura projektu

- `/services` - Definicje usług MCP
- `/monitoring` - Konfiguracja Prometheus i Grafana
- `/tests` - Testy E2E (Playwright)
- `/scripts` - Skrypty pomocnicze
- `/config` - Pliki konfiguracyjne
- `/docs` - Dokumentacja

## 📚 Dokumentacja

Szczegółowa dokumentacja znajduje się w katalogu `/docs`.

## 🧪 Testy

```bash
npm run test:e2e
```

## 📊 Monitoring

- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

## 🤝 Contributing

Zobacz [CONTRIBUTING.md](docs/CONTRIBUTING.md) dla szczegółów.

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.
"""
    
    def generate_gitignore(self) -> str:
        """Generuje zawartość pliku .gitignore"""
        return """# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Docker
docker-compose.override.yml
.docker/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Build
dist/
build/
*.egg-info/
.next/
out/

# Test coverage
coverage/
.coverage
htmlcov/
.pytest_cache/

# Database
*.db
*.sqlite
postgres_data/
redis_data/

# Models
ollama_models/
*.gguf

# Temporary
tmp/
temp/
*.tmp
"""
    
    def create_makefile(self):
        """Tworzy Makefile dla łatwego zarządzania projektem"""
        makefile_content = """# MCP Manager Makefile

.PHONY: help build start stop restart logs test clean

help: ## Wyświetl pomoc
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\\033[36m%-20s\\033[0m %s\\n", $$1, $$2}'

build: ## Zbuduj obrazy Docker
	docker-compose build

start: ## Uruchom wszystkie usługi
	docker-compose up -d

stop: ## Zatrzymaj wszystkie usługi
	docker-compose down

restart: stop start ## Restart wszystkich usług

logs: ## Pokaż logi
	docker-compose logs -f

test: ## Uruchom testy
	npm run test:e2e

test-unit: ## Uruchom testy jednostkowe
	npm test

test-integration: ## Uruchom testy integracyjne
	npm run test:integration

clean: ## Wyczyść dane
	docker-compose down -v
	rm -rf node_modules dist build

install: ## Zainstaluj zależności
	npm install
	pip install -r requirements.txt

dev: ## Tryb deweloperski
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

prod: ## Tryb produkcyjny
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

backup: ## Backup danych
	./scripts/backup.sh

restore: ## Przywróć dane
	./scripts/restore.sh

monitor: ## Otwórz monitoring
	open http://localhost:3001

app: ## Otwórz aplikację
	open http://localhost:3000

status: ## Status usług
	docker-compose ps

pull: ## Pobierz najnowsze obrazy
	docker-compose pull

update: pull restart ## Aktualizuj i restartuj

validate: ## Waliduj konfigurację
	docker-compose config

db-migrate: ## Migracje bazy danych
	docker-compose exec mcp-manager npm run migrate

db-seed: ## Seedowanie bazy danych
	docker-compose exec mcp-manager npm run seed

ollama-models: ## Pobierz modele Ollama
	docker exec mcp-ollama ollama pull llama3.2
	docker exec mcp-ollama ollama pull codellama
	docker exec mcp-ollama ollama pull mistral

health: ## Sprawdź zdrowie usług
	@./scripts/health-check.sh
"""
        
        makefile_path = self.output_dir / 'Makefile'
        with open(makefile_path, 'w') as f:
            f.write(makefile_content)
        logger.info("📝 Utworzono Makefile")
    
    def build(self):
        """Główna metoda budująca projekt"""
        logger.info(f"🏗️  Rozpoczynam budowanie projektu...")
        logger.info(f"📂 Folder źródłowy: {self.source_dir}")
        logger.info(f"📂 Folder docelowy: {self.output_dir}")
        
        # Tworzenie głównego katalogu
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Skanowanie plików Markdown
        markdown_files = self.scan_markdown_files()
        
        if not markdown_files:
            logger.error("❌ Nie znaleziono plików Markdown!")
            return False
        
        # Przetwarzanie każdego pliku
        all_file_definitions = []
        for md_file in markdown_files:
            logger.info(f"📄 Przetwarzam: {md_file.name}")
            self.stats['files_processed'] += 1
            
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Wyodrębnianie definicji plików
                file_definitions = self.extract_file_definitions(content)
                all_file_definitions.extend(file_definitions)
                
            except Exception as e:
                logger.error(f"❌ Błąd przy przetwarzaniu {md_file}: {e}")
                self.stats['errors'] += 1
        
        # Tworzenie struktury projektu
        self.create_project_structure()
        
        # Tworzenie plików
        if all_file_definitions:
            logger.info(f"🔨 Tworzę {len(all_file_definitions)} plików...")
            self.create_file_structure(all_file_definitions)
        
        # Tworzenie Makefile
        self.create_makefile()
        
        # Generowanie raportu
        self.generate_report()
        
        return True
    
    def generate_report(self):
        """Generuje raport z budowania projektu"""
        report = f"""
╔══════════════════════════════════════╗
║     🎉 BUDOWANIE ZAKOŃCZONE! 🎉      ║
╚══════════════════════════════════════╝

📊 Statystyki:
├─ Pliki Markdown przetworzone: {self.stats['files_processed']}
├─ Pliki utworzone: {self.stats['files_created']}
├─ Katalogi utworzone: {self.stats['dirs_created']}
└─ Błędy: {self.stats['errors']}

📂 Struktura projektu utworzona w:
   {self.output_dir}

🚀 Następne kroki:
   1. cd {self.output_dir}
   2. cp .env.example .env  # Skonfiguruj zmienne środowiskowe
   3. make install          # Zainstaluj zależności
   4. make start           # Uruchom aplikację

📖 Dokumentacja:
   - README.md - Instrukcja rozpoczęcia
   - Makefile - Dostępne komendy (make help)
   
🌐 Dostęp do aplikacji:
   - Aplikacja: http://localhost:3000
   - Monitoring: http://localhost:3001
"""
        
        print(report)
        
        # Zapisz raport do pliku
        report_path = self.output_dir / 'BUILD_REPORT.txt'
        with open(report_path, 'w') as f:
            f.write(report)
            f.write(f"\n\nCzas budowania: {datetime.now()}\n")
            f.write("\nUtworzono pliki:\n")
            for filepath in sorted(self.files_created):
                f.write(f"  - {filepath}\n")

def main():
    """Główna funkcja programu"""
    parser = argparse.ArgumentParser(
        description='MCP Project Builder - Generuje strukturę projektu z plików Markdown',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Przykłady użycia:
  python build_project.py ./markdown-docs
  python build_project.py ./docs --output ./my-project
  python build_project.py . --verbose
        """
    )
    
    parser.add_argument(
        'source',
        help='Ścieżka do folderu z plikami Markdown'
    )
    
    parser.add_argument(
        '--output', '-o',
        help='Folder docelowy dla projektu (domyślnie: ./mcp-manager-project)',
        default=None
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Tryb verbose - więcej informacji'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Tylko pokaż co zostanie utworzone, bez tworzenia plików'
    )
    
    args = parser.parse_args()
    
    # Ustawienie poziomu logowania
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Sprawdzenie czy folder źródłowy istnieje
    if not os.path.exists(args.source):
        logger.error(f"❌ Folder źródłowy nie istnieje: {args.source}")
        sys.exit(1)
    
    # Budowanie projektu
    builder = ProjectBuilder(args.source, args.output)
    
    if args.dry_run:
        logger.info("🔍 Tryb DRY RUN - tylko analiza, bez tworzenia plików")
        # TODO: Implementacja dry run
    
    success = builder.build()
    
    if not success:
        logger.error("❌ Budowanie projektu zakończone niepowodzeniem!")
        sys.exit(1)
    
    logger.info("✅ Budowanie projektu zakończone sukcesem!")

if __name__ == "__main__":
    main()