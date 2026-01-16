import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { parse as parseYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts"
import {
  verifyDocoraSignature,
  isImageFile,
  isMarkdownFile,
  isLumioIgnoreFile,
  getContentType,
  decodeBase64,
  hashTextContent,
  hashBinaryContent,
  type DocoraWebhookPayload,
  type DocoraAction,
} from "../_shared/docora.ts"
import {
  parseLumioIgnore,
  isIgnored,
  DEFAULT_IGNORE_PATTERNS,
} from "../_shared/lumioignore.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-docora-app-id, x-docora-signature, x-docora-timestamp",
}

interface LumioCardFrontmatter {
  title?: string
  tags?: string[]
  difficulty?: number
  language?: string
  [key: string]: unknown
}

interface LumioRepository {
  id: string
  user_id: string
  github_owner: string
  github_repo: string
  docora_repository_id: string | null
  cards_count: number
}

interface ChunkBufferEntry {
  id: string
  chunk_id: string
  repository_id: string
  file_path: string
  chunk_index: number
  chunk_total: number
  content: string
  content_encoding: string | null
  commit_sha: string | null
  timestamp: string | null
  previous_sha: string | null
  created_at: string
}

// In-memory cache for .lumioignore patterns per repository
// This is per-request, so it resets on each Edge Function invocation
const ignorePatternCache = new Map<string, string[]>()

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
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = mdImageRegex.exec(content)) !== null) {
    const path = match[1]
    if (!path.startsWith("http://") && !path.startsWith("https://")) {
      paths.push(path)
    }
  }
  return paths
}

/**
 * Get file extension
 */
function getExtension(path: string): string {
  const parts = path.split(".")
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ""
}

/**
 * Extract action from URL path
 * /docora-webhook/create -> "create"
 * /docora-webhook/update -> "update"
 * /docora-webhook/delete -> "delete"
 */
function extractAction(url: string): DocoraAction | null {
  const urlObj = new URL(url)
  const pathParts = urlObj.pathname.split("/").filter(Boolean)

  // Expected format: /docora-webhook/{action} or /functions/v1/docora-webhook/{action}
  const lastPart = pathParts[pathParts.length - 1]

  if (["create", "update", "delete"].includes(lastPart)) {
    return lastPart as DocoraAction
  }

  return null
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  try {
    // Extract action from URL
    const action = extractAction(req.url)
    if (!action) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use /create, /update, or /delete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get Docora headers
    const appId = req.headers.get("X-Docora-App-Id")
    const signature = req.headers.get("X-Docora-Signature")
    const timestamp = req.headers.get("X-Docora-Timestamp")

    if (!appId || !signature || !timestamp) {
      return new Response(
        JSON.stringify({ error: "Missing required Docora headers" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verify App ID matches
    const expectedAppId = Deno.env.get("DOCORA_APP_ID")
    if (appId !== expectedAppId) {
      return new Response(
        JSON.stringify({ error: "Invalid App ID" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get raw body for signature verification
    const bodyText = await req.text()

    // Verify HMAC signature
    const authKey = Deno.env.get("DOCORA_AUTH_KEY")
    if (!authKey) {
      console.error("DOCORA_AUTH_KEY not configured")
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const isValid = await verifyDocoraSignature(bodyText, signature, timestamp, authKey)
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Parse payload
    const payload: DocoraWebhookPayload = JSON.parse(bodyText)
    const { repository: docoraRepo, file, commit_sha, timestamp: payloadTimestamp, previous_sha } = payload

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find repository by docora_repository_id
    const { data: repo, error: repoError } = await supabase
      .from("lumio_repositories")
      .select("id, user_id, github_owner, github_repo, docora_repository_id, cards_count")
      .eq("docora_repository_id", docoraRepo.repository_id)
      .single()

    if (repoError || !repo) {
      console.error("Repository not found for Docora ID:", docoraRepo.repository_id)
      return new Response(
        JSON.stringify({ error: "Repository not registered", docoraId: docoraRepo.repository_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const repository = repo as LumioRepository

    // Handle chunked files
    if (file.chunk && file.chunk.index < file.chunk.total - 1) {
      // Not the last chunk - save to buffer and return
      await supabase.from("docora_chunk_buffer").insert({
        chunk_id: file.chunk.id,
        repository_id: repository.id,
        file_path: file.path,
        chunk_index: file.chunk.index,
        chunk_total: file.chunk.total,
        content: file.content,
        content_encoding: file.content_encoding || null,
        commit_sha: commit_sha,
        timestamp: payloadTimestamp,
        previous_sha: previous_sha || null,
      })

      return new Response(
        JSON.stringify({ success: true, message: `Chunk ${file.chunk.index + 1}/${file.chunk.total} received` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Assemble full content if this is the last chunk
    let fullContent = file.content
    let contentEncoding = file.content_encoding

    if (file.chunk && file.chunk.index === file.chunk.total - 1) {
      // Last chunk - retrieve and assemble all chunks
      const { data: chunks, error: chunksError } = await supabase
        .from("docora_chunk_buffer")
        .select("*")
        .eq("chunk_id", file.chunk.id)
        .order("chunk_index", { ascending: true })

      if (chunksError) {
        console.error("Error retrieving chunks:", chunksError)
        return new Response(
          JSON.stringify({ error: "Failed to retrieve chunks" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const chunkEntries = chunks as ChunkBufferEntry[]

      // Verify we have all previous chunks
      if (chunkEntries.length !== file.chunk.total - 1) {
        console.error(`Missing chunks: expected ${file.chunk.total - 1}, got ${chunkEntries.length}`)
        return new Response(
          JSON.stringify({ error: "Missing chunks", expected: file.chunk.total - 1, received: chunkEntries.length }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Concatenate all chunk contents
      const allContents = chunkEntries.map((c) => c.content)
      allContents.push(file.content)
      fullContent = allContents.join("")

      // Use encoding from first chunk (should be consistent)
      contentEncoding = chunkEntries[0]?.content_encoding || file.content_encoding

      // Clean up chunk buffer
      await supabase.from("docora_chunk_buffer").delete().eq("chunk_id", file.chunk.id)
    }

    // Check if file should be filtered
    const filePath = file.path

    // Handle .lumioignore file
    if (isLumioIgnoreFile(filePath)) {
      if (action === "delete") {
        // Clear cached patterns
        ignorePatternCache.delete(repository.id)
      } else {
        // Parse and cache patterns
        const patterns = parseLumioIgnore(fullContent)
        ignorePatternCache.set(repository.id, patterns)
      }

      // Update repository last_sync_at
      await supabase
        .from("lumio_repositories")
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: "synced",
        })
        .eq("id", repository.id)

      return new Response(
        JSON.stringify({ success: true, message: ".lumioignore processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get ignore patterns (from cache or load from existing card if available)
    let ignorePatterns = ignorePatternCache.get(repository.id)
    if (!ignorePatterns) {
      // Try to load from existing .lumioignore card
      const { data: ignoreCard } = await supabase
        .from("lumio_cards")
        .select("raw_content")
        .eq("repository_id", repository.id)
        .eq("file_path", ".lumioignore")
        .single()

      if (ignoreCard) {
        ignorePatterns = parseLumioIgnore(ignoreCard.raw_content)
        ignorePatternCache.set(repository.id, ignorePatterns)
      } else {
        ignorePatterns = []
      }
    }

    // Check if file should be ignored
    const allPatterns = [...DEFAULT_IGNORE_PATTERNS, ...ignorePatterns]
    if (isIgnored(filePath, allPatterns)) {
      return new Response(
        JSON.stringify({ success: true, message: "File ignored by pattern" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Filter: only process .md files and images
    const isMd = isMarkdownFile(filePath)
    const isImg = isImageFile(filePath)

    if (!isMd && !isImg) {
      return new Response(
        JSON.stringify({ success: true, message: "File type not supported (skipped)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Process based on action and file type
    if (isMd) {
      await processMarkdownFile(supabase, repository, filePath, fullContent, action)
    } else if (isImg) {
      await processImageFile(supabase, repository, filePath, fullContent, contentEncoding, action)
    }

    // Update repository stats
    const { count: cardsCount } = await supabase
      .from("lumio_cards")
      .select("*", { count: "exact", head: true })
      .eq("repository_id", repository.id)
      .eq("source_available", true)

    await supabase
      .from("lumio_repositories")
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: "synced",
        cards_count: cardsCount || 0,
      })
      .eq("id", repository.id)

    return new Response(
      JSON.stringify({
        success: true,
        action,
        filePath,
        fileType: isMd ? "markdown" : "image",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Docora Webhook Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

/**
 * Process a markdown file (create/update/delete)
 * Content is stored as-is; image URL resolution happens on the frontend
 */
async function processMarkdownFile(
  supabase: ReturnType<typeof createClient>,
  repository: LumioRepository,
  filePath: string,
  content: string,
  action: DocoraAction
): Promise<void> {
  if (action === "delete") {
    // Mark card as source_available = false
    await supabase
      .from("lumio_cards")
      .update({ source_available: false, updated_at: new Date().toISOString() })
      .eq("repository_id", repository.id)
      .eq("file_path", filePath)

    return
  }

  // Create or Update
  const rawContent = content
  const contentHash = await hashTextContent(rawContent)

  // Check if card exists and hash matches (skip if unchanged)
  const { data: existingCard } = await supabase
    .from("lumio_cards")
    .select("id, content_hash")
    .eq("repository_id", repository.id)
    .eq("file_path", filePath)
    .single()

  if (existingCard && existingCard.content_hash === contentHash) {
    // Content unchanged - skip
    return
  }

  // Parse frontmatter
  const { frontmatter, content: processedContent } = parseFrontmatter(rawContent)
  const title = frontmatter.title || filePath.split("/").pop()?.replace(".md", "") || null

  // Upsert card - content stored as-is, image URLs resolved on frontend
  const { error: cardError } = await supabase
    .from("lumio_cards")
    .upsert(
      {
        repository_id: repository.id,
        user_id: repository.user_id,
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
  }
}

/**
 * Process an image file (create/update/delete)
 * Images are stored with their original path structure for stateless URL resolution
 */
async function processImageFile(
  supabase: ReturnType<typeof createClient>,
  repository: LumioRepository,
  filePath: string,
  content: string,
  contentEncoding: string | undefined,
  action: DocoraAction
): Promise<void> {
  // Storage path preserves original file structure: user_id/repo_id/original/path/image.png
  const storagePath = `${repository.user_id}/${repository.id}/${filePath}`

  if (action === "delete") {
    // Delete image from storage
    const { error } = await supabase.storage.from("lumio-images").remove([storagePath])
    if (error) {
      console.error(`Failed to delete image ${filePath}:`, error)
    }
    return
  }

  // Create or Update image
  // Decode content (Docora sends images as base64)
  const imageData = contentEncoding === "base64" || !contentEncoding
    ? decodeBase64(content)
    : new TextEncoder().encode(content)

  const contentType = getContentType(filePath)

  // Upload to storage with original path structure
  const { error: uploadError } = await supabase.storage
    .from("lumio-images")
    .upload(storagePath, imageData, {
      contentType,
      upsert: true,
    })

  if (uploadError) {
    console.error(`Failed to upload image ${filePath}:`, uploadError)
  }
}
