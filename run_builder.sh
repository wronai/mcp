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
