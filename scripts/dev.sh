#!/bin/bash
# Fitness Coach Assistant - Avvia ambiente di sviluppo completo
# Esegui: ./scripts/dev.sh

set -e

echo "==================================="
echo "Fitness Coach Assistant - Dev Mode"
echo "==================================="
echo ""

# Verifica se Supabase e' in esecuzione
if ! npx supabase status &> /dev/null; then
    echo "Supabase non attivo. Avvio..."
    npm run supabase:start
    echo ""
fi

echo "Supabase attivo. Avvio Edge Functions e frontend..."
echo ""
echo "Frontend:       http://localhost:5173"
echo "Studio:         http://localhost:54323"
echo "Edge Functions: http://localhost:54321/functions/v1"
echo ""
echo "Premi Ctrl+C per fermare"
echo ""

# Avvia Edge Functions in background (con env file per Docora)
npm run supabase:functions &
FUNCTIONS_PID=$!

# Funzione per cleanup quando lo script viene fermato
cleanup() {
    echo ""
    echo "Fermando servizi..."
    kill $FUNCTIONS_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Avvia Vite dev server (questo blocca)
npm run dev

# Se Vite esce, ferma anche le functions
kill $FUNCTIONS_PID 2>/dev/null
