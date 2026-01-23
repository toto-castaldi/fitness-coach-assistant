import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, Key, FolderGit2, ChevronRight, Copy, RefreshCw, Trash2, Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useAISettings } from '@/hooks/useAISettings'

export function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loading, error, generateMcpApiKey, revokeMcpApiKey, hasMcpApiKey } = useAISettings()

  // MCP state
  const [mcpApiKey, setMcpApiKey] = useState<string | null>(null)
  const [generatingMcp, setGeneratingMcp] = useState(false)
  const [copiedMcp, setCopiedMcp] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Impostazioni</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* MCP Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Integrazione MCP
          </CardTitle>
          <CardDescription>
            Connetti Claude Desktop o altri client MCP per pianificare allenamenti con AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Status/Generation */}
          {mcpApiKey ? (
            // Show generated key (one time only)
            <div className="space-y-3">
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-2">
                  Copia questa API key ora - non sara piu visibile!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background p-2 rounded border font-mono break-all">
                    {mcpApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(mcpApiKey)
                      setCopiedMcp(true)
                      setTimeout(() => setCopiedMcp(false), 2000)
                    }}
                  >
                    {copiedMcp ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMcpApiKey(null)}
              >
                Ho copiato la chiave
              </Button>
            </div>
          ) : hasMcpApiKey() ? (
            // Key exists but hidden
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                API key configurata
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    setGeneratingMcp(true)
                    const newKey = await generateMcpApiKey()
                    if (newKey) setMcpApiKey(newKey)
                    setGeneratingMcp(false)
                  }}
                  disabled={generatingMcp}
                >
                  {generatingMcp ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Rigenera
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={async () => {
                    if (confirm('Sei sicuro di voler revocare la API key? I client MCP smetteranno di funzionare.')) {
                      await revokeMcpApiKey()
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            // No key exists
            <Button
              className="w-full"
              onClick={async () => {
                setGeneratingMcp(true)
                const newKey = await generateMcpApiKey()
                if (newKey) setMcpApiKey(newKey)
                setGeneratingMcp(false)
              }}
              disabled={generatingMcp}
            >
              {generatingMcp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Genera API Key
            </Button>
          )}

          {/* Configuration Instructions - Claude Desktop */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-medium">Claude Desktop</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Aggiungi questa configurazione al file <code className="bg-muted px-1 rounded">claude_desktop_config.json</code>
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`{
  "mcpServers": {
    "helix": {
      "url": "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/helix-mcp",
      "headers": {
        "X-Helix-API-Key": "<tua-api-key>"
      }
    }
  }
}`}
            </pre>
          </div>

          {/* Configuration Instructions - Claude Web */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-medium">Claude Web (claude.ai)</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Connetti Claude Web tramite OAuth senza bisogno di API key.
            </p>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Vai su <span className="font-medium text-foreground">claude.ai</span> e apri le impostazioni</li>
              <li>Aggiungi un nuovo <span className="font-medium text-foreground">Custom Connector</span></li>
              <li>Inserisci l'URL del server MCP:</li>
            </ol>
            <pre className="text-xs bg-muted p-2 rounded-md mt-2 overflow-x-auto">
{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/helix-mcp`}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              Claude Web ti reindirizzerà automaticamente per autorizzare l'accesso.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Repository Lumio */}
      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => navigate('/repositories')}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderGit2 className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">Repository Lumio</CardTitle>
                <CardDescription>
                  Gestisci i repository GitHub con le schede esercizi
                </CardDescription>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
