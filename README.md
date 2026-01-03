# Fitness Coach Assistant

Assistente di un Coach nell'ambito del fitness.

https://fca.toto-castaldi.com/

```
Leggi CLAUDE.md, README.md e tutta la cartella DOCS. Ora sei pronto.
```

**Versione:** 2025.12.27.2250

## Sviluppo Locale

### Prerequisiti

- **Node.js** 20+
- **Docker** (deve essere in esecuzione)

### Setup Iniziale

```bash
# Installa dipendenze
npm install
```

### Start

```bash
  export GOOGLE_CLIENT_ID="XYX"
  export GOOGLE_CLIENT_SECRET="ABC"
  npm run supabase:start
```

```bash
  npm run dev
```

L'app sara' disponibile su `http://localhost:5173`

### Comandi Supabase

| Comando                      | Descrizione                  |
|------------------------------|------------------------------|
| `npm run supabase:start`     | Avvia stack locale           |
| `npm run supabase:stop`      | Ferma stack locale           |
| `npm run supabase:reset`     | Reset DB (migrations + seed) |
| `npm run supabase:status`    | Mostra stato servizi         |
| `npm run supabase:functions` | Serve Edge Functions locali  |

### Edge Functions Locali

Le Edge Functions (`ai-chat`, `client-export`) sono servite automaticamente da `supabase start`.

Per sviluppare con hot-reload:

```bash
# In un terminale separato
npm run supabase:functions
```

**Nota**: Le funzioni AI richiedono API keys reali (OpenAI/Anthropic) configurate
nelle impostazioni dell'app.

### Google OAuth Locale

Per abilitare il login con Google in locale:

#### 1. Crea credenziali Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto (o creane uno nuovo)
3. Vai su **APIs & Services** > **Credentials**
4. Clicca **Create Credentials** > **OAuth 2.0 Client ID**
5. Tipo applicazione: **Web application**
6. Nome: `Fitness Coach Assistant - Local`
7. Authorized JavaScript origins: `http://localhost:5173`
8. Authorized redirect URIs: `http://localhost:54321/auth/v1/callback`
9. Clicca **Create** e copia Client ID e Client Secret

#### 2. Configura variabili ambiente

```bash
# Copia il template
cp .env.local.example .env.local

# Modifica .env.local con le tue credenziali Google
```

#### 3. Avvia Supabase con le credenziali

```bash
# Esporta le variabili (oppure usa direnv)
export GOOGLE_CLIENT_ID="<il-tuo-client-id>"
export GOOGLE_CLIENT_SECRET="<il-tuo-client-secret>"

# Avvia Supabase
npm run supabase:start
```

### Note

- Le migrations in `supabase/migrations/` vengono applicate automaticamente
- I dati locali persistono tra riavvii (salvati in Docker volume)
- Per un reset completo: `npm run supabase:stop` poi `npm run supabase:start`
