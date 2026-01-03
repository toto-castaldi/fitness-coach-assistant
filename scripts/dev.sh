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

echo "Supabase attivo. Avvio frontend..."
echo ""
echo "Frontend: http://localhost:5173"
echo "Studio:   http://localhost:54323"
echo ""
echo "Premi Ctrl+C per fermare"
echo ""

# Avvia Vite dev server
npm run dev
