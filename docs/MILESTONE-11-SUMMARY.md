# Riepilogo Milestone 11: Helix Live Tablet PWA

## Architettura
- **Multi-entry Vite**: `vite.config.live.ts` con plugin per servire `live.html` come root
- **Codice condiviso**: `src/shared/` con lib, hooks, types, ui components
- **Re-export**: file in `src/lib/`, `src/hooks/` che re-esportano da shared per retrocompatibilità

## File Principali Creati
```
src/
├── main-live.tsx          # Entry point tablet
├── AppLive.tsx            # Root component con routing
├── live/
│   ├── pages/
│   │   ├── TabletLogin.tsx      # Login dark theme
│   │   ├── TabletDateSelect.tsx # Selezione data
│   │   └── TabletLive.tsx       # Sessione live
│   └── components/
│       ├── ClientAvatar.tsx     # Avatar con iniziali colorate
│       ├── ClientStripBar.tsx   # Barra clienti in alto
│       ├── ActionPanel.tsx      # Pulsanti OK/SKIP
│       ├── ExerciseCard.tsx     # Card esercizio
│       ├── ExerciseCarousel.tsx # Carousel 3 colonne + swipe
│       ├── ParameterControl.tsx # Controlli +/- per parametri
│       └── SaveIndicator.tsx    # Indicatore salvataggio
```

## Deployment
- **GitHub Actions**: `.github/workflows/deploy.yml` aggiornato con build/deploy live app
- **Nginx**: `docs/nginx-live-example.conf` per `live.helix.toto-castaldi.com`
- **Secret richiesto**: `DEPLOY_PATH_LIVE`

## ExerciseCard - Layout Finale
1. **Nome** (32px) + Badge icona (✓ verde / ⏭ ambra)
2. **Descrizione** (60px fissi)
3. **Serie/Reps** (70px)
4. **Peso/Durata** (70px)
5. **Note/Textarea** (flex-1, min 60px)

## Colori Stati Esercizio
| Stato | Sfondo | Bordo |
|-------|--------|-------|
| Da fare | `gray-800` | `gray-700` |
| Corrente | `gray-800` | `gray-700` |
| Completato | `emerald-900/30` | `emerald-600` |
| Saltato | `amber-900/30` | `amber-600` |

## Comandi Dev (IMPORTANTE)
```bash
# Avvio ambiente pulito
pkill -9 -f vite 2>/dev/null
rm -rf node_modules/.vite
npm run dev &
npm run dev:live &

# Poi nel browser: Ctrl+Shift+Delete per svuotare cache
```

## URL Sviluppo
- Main: http://localhost:5173
- Live: http://localhost:5174

## Note Tecniche
- `npm run dev` e `npm run dev:live` usano `--force` per evitare problemi cache
- Se errore "504 Outdated Optimize Dep": ripetere procedura sopra + svuotare cache browser
- Swipe orizzontale per cambiare esercizio nel carousel
- Textarea per note visibile solo nell'esercizio corrente
