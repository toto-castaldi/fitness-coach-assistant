# Milestone 12: Helix MCP Server

## Obiettivo

Esporre i dati e le operazioni di Helix tramite un server MCP (Model Context Protocol), permettendo ai coach di usare il proprio client LLM (Claude Desktop, Cursor, etc.) per pianificare allenamenti interagendo direttamente con i dati Helix.

**Decisioni chiave:**
- Rimuovere completamente l'AI Planning interno (pagina `/planning`)
- Tools CRUD solo per Sessioni (clienti/palestre in sola lettura)
- Includere Prompts MCP per facilitare la pianificazione

---

## Architettura

```
┌─────────────────────┐          ┌──────────────────────────────────┐
│   Claude Desktop    │          │         Supabase                  │
│   o altro client    │   HTTP   │                                   │
│   MCP-compatible    │ =======> │  Edge Function: helix-mcp         │
└─────────────────────┘          │         │                         │
                                 │         ▼                         │
                                 │  PostgreSQL + RLS                 │
                                 │  (clients, sessions, exercises)   │
                                 └──────────────────────────────────┘
```

**Implementazione**: Supabase Edge Function con HTTP Streamable transport

---

## MCP Resources (Lettura Dati)

### Clienti
| Resource | URI | Descrizione |
|----------|-----|-------------|
| Lista clienti | `helix://clients` | Tutti i clienti del coach |
| Dettaglio cliente | `helix://clients/{id}` | Dati completi cliente |
| Scheda cliente | `helix://clients/{id}/card` | Markdown completo per contesto AI |
| Obiettivi cliente | `helix://clients/{id}/goals` | Storico obiettivi |
| Sessioni cliente | `helix://clients/{id}/sessions` | Sessioni del cliente |

### Palestre
| Resource | URI | Descrizione |
|----------|-----|-------------|
| Lista palestre | `helix://gyms` | Tutte le palestre |
| Dettaglio palestra | `helix://gyms/{id}` | Info palestra con attrezzature |

### Esercizi
| Resource | URI | Descrizione |
|----------|-----|-------------|
| Lista esercizi | `helix://exercises` | Tutti gli esercizi (default + custom) |
| Dettaglio esercizio | `helix://exercises/{id}` | Esercizio con descrizione |
| Scheda Lumio | `helix://exercises/{id}/lumio` | Contenuto carta Lumio se presente |
| Per tag | `helix://exercises/tags/{tag}` | Esercizi filtrati per tag |
| Lista tag | `helix://exercises/tags` | Tutti i tag disponibili |

### Sessioni
| Resource | URI | Descrizione |
|----------|-----|-------------|
| Lista sessioni | `helix://sessions` | Tutte le sessioni |
| Per data | `helix://sessions/date/{YYYY-MM-DD}` | Sessioni di una data |
| Pianificate | `helix://sessions/planned` | Solo sessioni planned |
| Dettaglio | `helix://sessions/{id}` | Sessione con esercizi |

### Utilità
| Resource | URI | Descrizione |
|----------|-----|-------------|
| Riepilogo coach | `helix://coach/summary` | Conteggi: clienti, sessioni, palestre |
| Sessioni oggi | `helix://today` | Sessioni pianificate per oggi |

---

## MCP Tools (Azioni/Mutazioni)

### Sessioni (CRUD completo)
| Tool | Parametri | Descrizione |
|------|-----------|-------------|
| `create_session` | client_id, session_date, gym_id?, notes? | Crea sessione |
| `update_session` | session_id, session_date?, gym_id?, notes? | Modifica sessione |
| `delete_session` | session_id | Elimina sessione |
| `complete_session` | session_id | Marca come completata |
| `duplicate_session` | session_id, new_date, new_client_id? | Duplica sessione |

### Esercizi in Sessione
| Tool | Parametri | Descrizione |
|------|-----------|-------------|
| `add_session_exercise` | session_id, exercise_id, sets?, reps?, weight_kg?, duration_seconds?, notes? | Aggiungi esercizio |
| `update_session_exercise` | session_exercise_id, sets?, reps?, weight_kg?, duration_seconds?, notes? | Modifica parametri |
| `remove_session_exercise` | session_exercise_id | Rimuovi esercizio |
| `reorder_session_exercises` | session_id, exercise_ids[] | Riordina esercizi |

### Pianificazione AI
| Tool | Parametri | Descrizione |
|------|-----------|-------------|
| `create_training_plan` | client_id, session_date, gym_id?, exercises[] | Crea sessione da piano AI |

---

## MCP Prompts (Template Riutilizzabili)

| Prompt | Argomenti | Descrizione |
|--------|-----------|-------------|
| `plan-session` | client_id, focus_areas?[], session_date? | Genera piano allenamento |
| `weekly-plan` | client_id, start_date, sessions_count | Pianifica settimana |
| `session-review` | session_id | Analizza sessione completata |
| `daily-briefing` | date? | Riepilogo giornata |

---

## Autenticazione

**API Key dedicata** per ogni coach:
- Nuova colonna `helix_mcp_api_key_hash` in `coach_ai_settings`
- Header: `X-Helix-API-Key: <api_key>`
- UI in Settings per generare/rigenerare API key

---

## Struttura File

```
supabase/functions/
├── helix-mcp/
│   ├── index.ts              # Entry point MCP server
│   ├── auth.ts               # Autenticazione API key
│   ├── resources/
│   │   ├── clients.ts
│   │   ├── gyms.ts
│   │   ├── exercises.ts
│   │   └── sessions.ts
│   ├── tools/
│   │   ├── sessions.ts
│   │   └── planning.ts
│   └── prompts/
│       └── planning.ts
└── _shared/
    └── client-card.ts        # Generazione scheda cliente (condiviso)
```

---

## Database Migration

```sql
-- 00000000000016_mcp_api_key.sql
ALTER TABLE public.coach_ai_settings
ADD COLUMN helix_mcp_api_key_hash text;

CREATE INDEX coach_ai_settings_mcp_key_idx
ON public.coach_ai_settings(helix_mcp_api_key_hash);
```

---

## UI Changes

### Settings Page
- Nuova sezione "Integrazione MCP"
- Bottone "Genera API Key"
- Visualizzazione API key (una volta sola)
- Istruzioni configurazione Claude Desktop

### Rimozione AI Planning
- Rimuovere pagina `/planning` e route
- Rimuovere voce menu "Pianifica con AI"
- Rimuovere Edge Functions `ai-chat`
- Rimuovere campi API keys da Settings (OpenAI/Anthropic)
- Mantenere tabelle `ai_*` per storico (no data loss)

---

## Configurazione Claude Desktop

```json
{
  "mcpServers": {
    "helix": {
      "url": "https://<project>.supabase.co/functions/v1/helix-mcp",
      "headers": {
        "X-Helix-API-Key": "<api-key-generata>"
      }
    }
  }
}
```

---

## Fasi Implementazione

### Fase 1: Setup e Resources Base
- [ ] Migration API key (`00000000000016_mcp_api_key.sql`)
- [ ] Edge Function `helix-mcp` con autenticazione API key
- [ ] Resources: clients, gyms, exercises, sessions (tutti read-only)
- [ ] Resource `client-card` con markdown completo
- [ ] Deploy e test con MCP Inspector

### Fase 2: Tools
- [ ] Session CRUD tools (create, update, delete, complete, duplicate)
- [ ] Session exercise tools (add, update, remove, reorder)
- [ ] Tool `create_training_plan` per creare sessione da piano AI

### Fase 3: Prompts
- [ ] Prompt `plan-session` con contesto cliente
- [ ] Prompt `weekly-plan` per pianificazione settimanale
- [ ] Prompt `session-review` per analisi sessioni
- [ ] Prompt `daily-briefing` per riepilogo giornata

### Fase 4: UI Settings
- [ ] Sezione "Integrazione MCP" in Settings
- [ ] Generazione/visualizzazione API key
- [ ] Istruzioni configurazione Claude Desktop

### Fase 5: Rimozione AI Planning Interno
- [ ] Rimuovere pagina `/planning` e componenti
- [ ] Rimuovere route da `App.tsx`
- [ ] Rimuovere voce menu
- [ ] Rimuovere Edge Function `ai-chat`
- [ ] Rimuovere hook `useAIPlanning`, `useAISettings`
- [ ] Rimuovere sezione API keys da Settings
- [ ] Aggiornare deploy.yml (rimuovere ai-chat)

---

## Verifica

1. **Test MCP Inspector**: Verificare resources e tools funzionano
2. **Test Claude Desktop**: Configurare e testare flusso completo
3. **Test autenticazione**: API key valida/invalida
4. **Test RLS**: Verificare isolamento dati tra coach
5. **Test creazione sessione**: AI genera piano → tool crea sessione

---

## File Critici

### Da Creare
- `supabase/functions/helix-mcp/` - Edge Function MCP server
- `supabase/functions/_shared/client-card.ts` - Generazione scheda cliente (estratto da ai-chat)
- `supabase/migrations/00000000000016_mcp_api_key.sql` - Migration API key

### Da Modificare
- `src/pages/Settings.tsx` - Aggiungere sezione MCP, rimuovere API keys AI
- `src/App.tsx` - Rimuovere route `/planning`
- `src/components/Layout.tsx` - Rimuovere voce menu AI Planning
- `.github/workflows/deploy.yml` - Aggiungere helix-mcp, rimuovere ai-chat

### Da Rimuovere
- `src/pages/Planning.tsx`
- `src/components/planning/` (intera cartella)
- `src/hooks/useAIPlanning.ts`
- `src/hooks/useAISettings.ts`
- `supabase/functions/ai-chat/`
