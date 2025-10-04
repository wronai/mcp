# MCP Manager Project

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
