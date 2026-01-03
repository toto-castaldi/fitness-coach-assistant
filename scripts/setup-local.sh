#!/bin/bash
# Fitness Coach Assistant - Setup ambiente locale
# Esegui: ./scripts/setup-local.sh

set -e

echo "==================================="
echo "Fitness Coach Assistant - Setup"
echo "==================================="
echo ""

# Verifica Docker
echo "Verifico Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERRORE: Docker non installato. Installa Docker e riprova."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "ERRORE: Docker non in esecuzione. Avvia Docker e riprova."
    exit 1
fi
echo "Docker OK"

# Verifica Node
echo "Verifico Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERRORE: Node.js non installato. Installa Node.js 20+ e riprova."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "ERRORE: Node.js version $NODE_VERSION. Richiesto 20+."
    exit 1
fi
echo "Node.js OK ($(node -v))"

# Installa dipendenze
echo ""
echo "Installo dipendenze npm..."
npm install

# Copia .env.local se non esiste
if [ ! -f .env.local ]; then
    if [ -f .env.local.example ]; then
        echo ""
        echo "Creo .env.local da template..."
        cp .env.local.example .env.local
        echo "NOTA: Modifica .env.local con le tue credenziali Google OAuth"
    fi
fi

# Avvia Supabase
echo ""
echo "Avvio Supabase locale..."
npm run supabase:start

echo ""
echo "==================================="
echo "Setup completato!"
echo "==================================="
echo ""
echo "Prossimi passi:"
echo "  1. Configura .env.local con le credenziali Google OAuth"
echo "  2. Avvia il frontend: npm run dev"
echo "  3. Apri http://localhost:5173"
echo ""
echo "Comandi utili:"
echo "  npm run supabase:status   - Stato servizi"
echo "  npm run supabase:stop     - Ferma Supabase"
echo "  npm run supabase:reset    - Reset database"
echo ""
