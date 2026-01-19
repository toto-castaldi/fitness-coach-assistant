/**
 * @deprecated This Edge Function is deprecated.
 * Use Docora integration instead (docora-webhook handles automatic sync).
 * This function is kept for backwards compatibility during migration.
 * It will be removed in a future version.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { parse as parseYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts"
import {
  getLatestCommitInfo,
  getRepositoryTree,
  getRawFileContent,
  getRawBinaryContent,
  type GitHubTreeItem,
} from "../_shared/github.ts"
import {
  parseLumioIgnore,
  filterMarkdownFiles,
} from "../_shared/lumioignore.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface LumioCardFrontmatter {
  title?: string
  tags?: string[]
  difficulty?: number
  language?: string
  [key: string]: unknown
}

interface RequestBody {
  repositoryId: string
  force?: boolean
  userId?: string  // For internal calls with service_role key
}

interface LumioRepository {
  id: string
  user_id: string
  github_owner: string
  github_repo: string
  access_token: string | null
  last_commit_hash: string | null
}

interface ExistingCard {
  id: string
  file_path: string
  content_hash: string | null
}

interface SyncStats {
  added: number
  updated: number
  removed: number
  unchanged: number
}

// Always use 'main' branch
const BRANCH = 'main'

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(markdown: string): {
  frontmatter: LumioCardFrontmatter
  content: string
  rawContent: string
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = markdown.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, content: markdown, rawContent: markdown }
  }

  try {
    const yamlContent = match[1]
    const frontmatter = parseYaml(yamlContent) as LumioCardFrontmatter
    const content = markdown.slice(match[0].length)
    return { frontmatter, content, rawContent: markdown }
  } catch {
    return { frontmatter: {}, content: markdown, rawContent: markdown }
  }
}

/**
 * Extract image paths from markdown content
 */
function extractImagePaths(content: string): string[] {
  const paths: string[] = []

  // Match ![alt](path) format
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = mdImageRegex.exec(content)) !== null) {
    const path = match[1]
    // Skip external URLs
    if (!path.startsWith("http://") && !path.startsWith("https://")) {
      paths.push(path)
    }
  }

  return paths
}

/**
 * Resolve relative path from card file location
 */
function resolvePath(cardPath: string, imagePath: string): string {
  // Handle absolute paths from repo root
  if (imagePath.startsWith("/")) {
    return imagePath.slice(1)
  }

  // Handle relative paths
  const cardDir = cardPath.split("/").slice(0, -1).join("/")

  if (imagePath.startsWith("./")) {
    imagePath = imagePath.slice(2)
  }

  // Handle ../ paths
  const parts = [...cardDir.split("/"), ...imagePath.split("/")]
  const resolved: string[] = []

  for (const part of parts) {
    if (part === "..") {
      resolved.pop()
    } else if (part !== "." && part !== "") {
      resolved.push(part)
    }
  }

  return resolved.join("/")
}

/**
 * Generate a hash for binary content (images)
 */
async function hashBinaryContent(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16)
}

/**
 * Generate a hash for text content (cards)
 */
async function hashTextContent(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Get file extension from path
 */
function getExtension(path: string): string {
  const parts = path.split(".")
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ""
}

Deno.serve(async (req: Request) => {
  // DEPRECATION WARNING
  console.warn(
    "[DEPRECATED] lumio-sync-repo is deprecated. " +
    "Use Docora integration instead (docora-webhook handles automatic sync). " +
    "This function will be removed in a future version."
  )

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body first to check for userId (internal call)
    const body: RequestBody = await req.json()
    const { repositoryId, force = false, userId: bodyUserId } = body

    // Determine user ID - either from JWT or from body (for internal service_role calls)
    let userId: string

    const token = authHeader.replace("Bearer ", "")

    // Check if this is a service_role call with userId in body
    if (bodyUserId && token === supabaseServiceKey) {
      // Internal call with service_role key
      userId = bodyUserId
    } else {
      // Regular user call - validate JWT
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      userId = user.id
    }

    if (!repositoryId) {
      return new Response(
        JSON.stringify({ error: "repositoryId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get repository from database
    const { data: repo, error: repoError } = await supabase
      .from("lumio_repositories")
      .select("*")
      .eq("id", repositoryId)
      .eq("user_id", userId)
      .single()

    if (repoError || !repo) {
      return new Response(
        JSON.stringify({ error: "Repository not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const repository = repo as LumioRepository

    // Update status to syncing
    await supabase
      .from("lumio_repositories")
      .update({ sync_status: "syncing", sync_error: null })
      .eq("id", repositoryId)

    try {
      // Get latest commit info (hash + date, always use 'main' branch)
      const commitInfo = await getLatestCommitInfo(
        repository.github_owner,
        repository.github_repo,
        BRANCH,
        repository.access_token
      )
      const latestHash = commitInfo.sha
      const lastCommitAt = commitInfo.date

      // Check if already synced (no changes in repository)
      if (!force && repository.last_commit_hash === latestHash) {
        // Get current cards count for unchanged stat
        const { count: cardsCount } = await supabase
          .from("lumio_cards")
          .select("*", { count: "exact", head: true })
          .eq("repository_id", repositoryId)
          .eq("source_available", true)

        await supabase
          .from("lumio_repositories")
          .update({
            sync_status: "synced",
            last_sync_at: new Date().toISOString(),
            last_commit_at: lastCommitAt,
            last_sync_added: 0,
            last_sync_updated: 0,
            last_sync_removed: 0,
            last_sync_unchanged: cardsCount || 0,
          })
          .eq("id", repositoryId)

        return new Response(
          JSON.stringify({
            success: true,
            message: "Already up to date",
            stats: { added: 0, updated: 0, removed: 0, unchanged: cardsCount || 0 },
            lastCommitAt,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Get repository tree (always use 'main' branch)
      const tree = await getRepositoryTree(
        repository.github_owner,
        repository.github_repo,
        BRANCH,
        repository.access_token
      )

      // Get .lumioignore if exists
      let ignorePatterns: string[] = []
      const ignoreFile = tree.find((item: GitHubTreeItem) =>
        item.path === ".lumioignore" && item.type === "blob"
      )
      if (ignoreFile) {
        try {
          const ignoreContent = await getRawFileContent(
            repository.github_owner,
            repository.github_repo,
            ".lumioignore",
            BRANCH,
            repository.access_token
          )
          ignorePatterns = parseLumioIgnore(ignoreContent)
        } catch {
          console.warn("Failed to parse .lumioignore")
        }
      }

      // Filter markdown files
      const allFiles = tree
        .filter((item: GitHubTreeItem) => item.type === "blob")
        .map((item: GitHubTreeItem) => item.path)
      const mdFiles = filterMarkdownFiles(allFiles, ignorePatterns)

      // Get existing cards with their hashes for comparison
      const { data: existingCardsData } = await supabase
        .from("lumio_cards")
        .select("id, file_path, content_hash")
        .eq("repository_id", repositoryId)

      const existingCards = new Map<string, ExistingCard>()
      if (existingCardsData) {
        for (const card of existingCardsData) {
          existingCards.set(card.file_path, card as ExistingCard)
        }
      }

      // Track sync statistics
      const stats: SyncStats = { added: 0, updated: 0, removed: 0, unchanged: 0 }
      const processedCardPaths = new Set<string>()

      // Process each markdown file
      for (const filePath of mdFiles) {
        try {
          // Fetch markdown content
          const rawContent = await getRawFileContent(
            repository.github_owner,
            repository.github_repo,
            filePath,
            BRANCH,
            repository.access_token
          )

          // Calculate content hash
          const contentHash = await hashTextContent(rawContent)

          // Check if card exists and hash matches (skip if unchanged)
          const existingCard = existingCards.get(filePath)
          if (existingCard && existingCard.content_hash === contentHash) {
            // Card unchanged - skip processing
            processedCardPaths.add(filePath)
            stats.unchanged++
            continue
          }

          // Determine if this is an add or update
          const isNewCard = !existingCard

          // Parse frontmatter
          const { frontmatter, content } = parseFrontmatter(rawContent)
          const title = frontmatter.title || filePath.split("/").pop()?.replace(".md", "") || null

          // Extract and process images (only for new/updated cards)
          const imagePaths = extractImagePaths(rawContent)
          const imageMapping: Record<string, string> = {}

          for (const imagePath of imagePaths) {
            try {
              const resolvedPath = resolvePath(filePath, imagePath)

              // Fetch image
              const { data: imageData, contentType } = await getRawBinaryContent(
                repository.github_owner,
                repository.github_repo,
                resolvedPath,
                BRANCH,
                repository.access_token
              )

              // Generate hash for filename
              const hash = await hashBinaryContent(imageData)
              const ext = getExtension(resolvedPath)
              const storagePath = `${userId}/${repositoryId}/${hash}.${ext}`

              // Upload to storage
              const { error: uploadError } = await supabase.storage
                .from("lumio-images")
                .upload(storagePath, imageData, {
                  contentType,
                  upsert: true,
                })

              if (!uploadError) {
                // Get public URL
                const { data: publicUrl } = supabase.storage
                  .from("lumio-images")
                  .getPublicUrl(storagePath)

                // Fix URL for local development (replace internal Docker URL with external URL)
                let finalUrl = publicUrl.publicUrl
                const externalUrl = Deno.env.get("API_EXTERNAL_URL")
                if (externalUrl) {
                  // Replace internal kong URL with external URL
                  finalUrl = finalUrl.replace(/http:\/\/kong:\d+/, externalUrl)
                } else if (finalUrl.includes("kong:")) {
                  // Fallback for local development: replace kong URL with localhost
                  finalUrl = finalUrl.replace(/http:\/\/kong:\d+/, "http://127.0.0.1:54321")
                }

                imageMapping[imagePath] = finalUrl
              }
            } catch (imgError) {
              console.warn(`Failed to process image ${imagePath}:`, imgError)
            }
          }

          // Replace image paths in content
          let processedContent = content
          for (const [originalPath, newUrl] of Object.entries(imageMapping)) {
            // Escape special regex characters in path
            const escapedPath = originalPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            processedContent = processedContent.replace(
              new RegExp(`!\\[([^\\]]*)\\]\\(${escapedPath}\\)`, "g"),
              `![$1](${newUrl})`
            )
          }

          // Upsert card in database with content_hash
          const { data: card, error: cardError } = await supabase
            .from("lumio_cards")
            .upsert(
              {
                repository_id: repositoryId,
                user_id: userId,
                file_path: filePath,
                title,
                content: processedContent,
                raw_content: rawContent,
                content_hash: contentHash,
                frontmatter,
                source_available: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "repository_id,file_path" }
            )
            .select()
            .single()

          if (cardError) {
            console.error(`Failed to upsert card ${filePath}:`, cardError)
            continue
          }

          // Update stats
          if (isNewCard) {
            stats.added++
          } else {
            stats.updated++
          }

          // Upsert image mappings
          for (const [originalPath, storagePath] of Object.entries(imageMapping)) {
            // Extract storage path from URL
            const pathMatch = storagePath.match(/lumio-images\/(.+)$/)
            if (pathMatch && card) {
              await supabase.from("lumio_card_images").upsert(
                {
                  card_id: card.id,
                  original_path: originalPath,
                  storage_path: pathMatch[1],
                },
                { onConflict: "card_id,original_path" }
              )
            }
          }

          processedCardPaths.add(filePath)
        } catch (fileError) {
          console.error(`Failed to process ${filePath}:`, fileError)
        }
      }

      // Mark cards not in current sync as source_available = false (removed from source)
      for (const [cardPath, card] of existingCards) {
        if (!processedCardPaths.has(cardPath)) {
          await supabase
            .from("lumio_cards")
            .update({ source_available: false })
            .eq("id", card.id)
          stats.removed++
        }
      }

      // Calculate total cards count (added + updated + unchanged)
      const totalCardsCount = stats.added + stats.updated + stats.unchanged

      // Update repository status with delta stats
      await supabase
        .from("lumio_repositories")
        .update({
          last_commit_hash: latestHash,
          last_commit_at: lastCommitAt,
          last_sync_at: new Date().toISOString(),
          sync_status: "synced",
          sync_error: null,
          cards_count: totalCardsCount,
          last_sync_added: stats.added,
          last_sync_updated: stats.updated,
          last_sync_removed: stats.removed,
          last_sync_unchanged: stats.unchanged,
        })
        .eq("id", repositoryId)

      return new Response(
        JSON.stringify({
          success: true,
          stats,
          cardsCount: totalCardsCount,
          commitHash: latestHash,
          lastCommitAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    } catch (syncError) {
      // Update repository with error
      const errorMessage = syncError instanceof Error ? syncError.message : "Unknown error"

      await supabase
        .from("lumio_repositories")
        .update({
          sync_status: "error",
          sync_error: errorMessage,
        })
        .eq("id", repositoryId)

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  } catch (error) {
    console.error("Lumio Sync Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
