import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { parse as parseYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface LumioCardFrontmatter {
  title?: string
  tags?: string[]
  difficulty?: number
  language?: string
}

interface RequestBody {
  cardUrl: string
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(markdown: string): { frontmatter: LumioCardFrontmatter; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = markdown.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, content: markdown }
  }

  try {
    const yamlContent = match[1]
    const frontmatter = parseYaml(yamlContent) as LumioCardFrontmatter
    const content = markdown.slice(match[0].length)
    return { frontmatter, content }
  } catch {
    return { frontmatter: {}, content: markdown }
  }
}

/**
 * Extract base URL from card URL for resolving relative image paths
 * Example: https://raw.githubusercontent.com/user/repo/main/cards/exercise.md
 *       -> https://raw.githubusercontent.com/user/repo/main
 */
function getBaseUrl(cardUrl: string): string {
  try {
    const url = new URL(cardUrl)
    const pathParts = url.pathname.split("/")
    // Remove the filename (last part)
    pathParts.pop()
    return `${url.origin}${pathParts.join("/")}`
  } catch {
    return ""
  }
}

/**
 * Resolve relative image paths in markdown to absolute URLs
 */
function resolveImagePaths(content: string, baseUrl: string): string {
  if (!baseUrl) return content

  // Match markdown images: ![alt](path) and HTML images: src="path"
  // Handle relative paths starting with / or ./
  return content
    // Handle /assets/... style paths (relative to repo root)
    .replace(
      /!\[([^\]]*)\]\(\/([^)]+)\)/g,
      (_, alt, path) => {
        // For /assets/... paths, we need to go to repo root
        // Extract repo root from baseUrl (e.g., .../user/repo/main)
        const repoRootMatch = baseUrl.match(/^(https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+)/)
        const repoRoot = repoRootMatch ? repoRootMatch[1] : baseUrl
        return `![${alt}](${repoRoot}/${path})`
      }
    )
    // Handle ./relative/... style paths
    .replace(
      /!\[([^\]]*)\]\(\.\/([^)]+)\)/g,
      (_, alt, path) => `![${alt}](${baseUrl}/${path})`
    )
    // Handle relative paths without prefix (not starting with http)
    .replace(
      /!\[([^\]]*)\]\((?!https?:\/\/)([^/)][^)]*)\)/g,
      (_, alt, path) => `![${alt}](${baseUrl}/${path})`
    )
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const body: RequestBody = await req.json()
    const { cardUrl } = body

    if (!cardUrl) {
      return new Response(
        JSON.stringify({ error: "cardUrl is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Validate URL format
    try {
      new URL(cardUrl)
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid cardUrl format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Fetch the markdown card from external URL
    const response = await fetch(cardUrl, {
      headers: {
        "Accept": "text/plain, text/markdown, */*",
        "User-Agent": "FitnessCoachAssistant/1.0",
      },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Failed to fetch card: ${response.status} ${response.statusText}`
        }),
        {
          status: response.status === 404 ? 404 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const markdown = await response.text()

    // Parse frontmatter and content
    const { frontmatter, content } = parseFrontmatter(markdown)

    // Get base URL for resolving relative image paths
    const baseUrl = getBaseUrl(cardUrl)

    // Resolve relative image paths
    const resolvedContent = resolveImagePaths(content, baseUrl)

    return new Response(
      JSON.stringify({
        frontmatter,
        content: resolvedContent,
        baseUrl,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          // Cache for 1 hour on CDN, 7 days in browser
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      }
    )
  } catch (error) {
    console.error("Lumio Card Fetch Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
