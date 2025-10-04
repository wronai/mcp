# MCP Manager Makefile

.PHONY: help build start stop restart logs test clean

help: ## Wyświetl pomoc
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Zbuduj obrazy Docker
	docker-compose build

up: ## Uruchom wszystkie usługi
	docker-compose up --build

down: ## Zatrzymaj wszystkie usługi
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
