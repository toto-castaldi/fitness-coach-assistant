# Guida Sviluppo Locale

Guida completa per configurare e utilizzare l'ambiente di sviluppo locale con Supabase.

## Prerequisiti

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - Per clonare il repository

Verifica installazione:

```bash
node -v    # Deve essere >= 20
docker -v  # Qualsiasi versione recente
```

## Setup Iniziale

### Metodo Rapido

```bash
npm run setup:local
```

Questo script:
1. Verifica Docker e Node.js
2. Installa le dipendenze npm
3. Crea `.env.local` dal template
4. Avvia Supabase locale

### Metodo Manuale

```bash
# 1. Clona il repository
git clone <repo-url>
cd fitness-coach-assistant

# 2. Installa dipendenze
npm install

# 3. Crea file ambiente locale
cp .env.local.example .env.local

# 4. Avvia Supabase
npm run supabase:start
```

## Avvio Ambiente di Sviluppo

### Tutto in uno

```bash
npm run dev:local
```

### Separatamente

```bash
# Terminale 1: Supabase
npm run supabase:start

# Terminale 2: Frontend
npm run dev

# Terminale 3 (opzionale): Edge Functions con hot-reload
npm run supabase:functions
```

## URL e Servizi

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| Frontend | `http://localhost:5173` | App React |
| Supabase API | `http://127.0.0.1:54321` | REST/GraphQL API |
| Studio | `http://127.0.0.1:54323` | GUI database |
| Mailpit | `http://127.0.0.1:54324` | Email testing |
| Database | `127.0.0.1:54322` | PostgreSQL diretto |

## Google OAuth Locale

Per abilitare il login con Google:

### 1. Crea credenziali Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea/seleziona un progetto
3. Vai su **APIs & Services** > **Credentials**
4. **Create Credentials** > **OAuth 2.0 Client ID**
5. Tipo: **Web application**
6. Nome: `FCA Local`
7. JavaScript origins: `http://localhost:5173`
8. Redirect URIs: `http://localhost:54321/auth/v1/callback`

### 2. Configura variabili ambiente

Modifica `.env.local`:

```env
GOOGLE_CLIENT_ID=<il-tuo-client-id>
GOOGLE_CLIENT_SECRET=<il-tuo-client-secret>
```

### 3. Riavvia Supabase

```bash
export GOOGLE_CLIENT_ID="<id>"
export GOOGLE_CLIENT_SECRET="<secret>"
npm run supabase:start
```

## Database

### Reset completo

```bash
npm run supabase:reset
```

Questo:
- Ricrea il database
- Applica tutte le migrations
- Esegue il seed data (15 esercizi default)

### Connessione diretta

```bash
# Con psql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres

# Oppure usa Studio
open http://127.0.0.1:54323
```

### Seed Data

Il file `supabase/seed.sql` include:
- 15 esercizi default (visibili a tutti)
- Tag per ogni esercizio
- Blocchi step-by-step per squat e plank

Per aggiungere clienti/palestre/sessioni dopo il login, vedi le istruzioni in fondo al file `seed.sql`.

## Edge Functions

Le Edge Functions sono servite automaticamente da `supabase start`.

Per sviluppo con hot-reload:

```bash
npm run supabase:functions
```

**Nota**: Le funzioni AI (`ai-chat`) richiedono API key reali OpenAI/Anthropic configurate nelle impostazioni dell'app.

## Comandi Utili

| Comando | Descrizione |
|---------|-------------|
| `npm run setup:local` | Setup iniziale completo |
| `npm run dev:local` | Avvia tutto |
| `npm run supabase:start` | Avvia Supabase |
| `npm run supabase:stop` | Ferma Supabase |
| `npm run supabase:reset` | Reset database |
| `npm run supabase:status` | Stato servizi |
| `npm run supabase:functions` | Edge Functions hot-reload |

## Troubleshooting

### Porta gia' in uso

```
Error: port 54322 already in use
```

Soluzione:
```bash
# Ferma altri progetti Supabase
npx supabase stop --project-id <altro-progetto>

# Oppure ferma tutto
docker stop $(docker ps -q)
```

### Docker non risponde

```
Error: Cannot connect to Docker daemon
```

Soluzione: Avvia Docker Desktop e attendi che sia completamente avviato.

### Migrations fallite

```bash
# Reset completo del database
npm run supabase:stop
npm run supabase:start
```

### Seed non eseguito

```bash
# Forza reset con seed
npm run supabase:reset
```

## Differenze Locale vs Produzione

| Aspetto | Locale | Produzione |
|---------|--------|------------|
| Database | Docker container | Supabase Cloud |
| Auth | Configurabile | Google OAuth |
| Storage | Docker volume | Supabase Storage |
| Edge Functions | Deno locale | Supabase Edge |
| URL | `localhost:*` | `*.supabase.co` |

## File di Configurazione

| File | Scopo |
|------|-------|
| `supabase/config.toml` | Configurazione Supabase locale |
| `.env.local` | Variabili ambiente locali |
| `.env.local.example` | Template variabili |
| `supabase/seed.sql` | Dati di esempio |
