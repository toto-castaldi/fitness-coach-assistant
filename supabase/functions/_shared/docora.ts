/**
 * Docora Integration Helper
 * Utilities for interacting with Docora API and validating webhooks
 */

/**
 * Docora webhook payload types
 */
export interface DocoraRepository {
  repository_id: string
  github_url: string
  owner: string
  name: string
}

export interface DocoraFileChunk {
  id: string        // UUID
  index: number     // 0-indexed
  total: number     // Total number of chunks
}

export interface DocoraFile {
  path: string
  sha: string
  size: number
  content: string
  content_encoding?: "base64"  // Only for binary files
  chunk?: DocoraFileChunk      // Only if file is chunked
}

export interface DocoraWebhookPayload {
  repository: DocoraRepository
  file: DocoraFile
  commit_sha: string
  timestamp: string
  previous_sha?: string  // Only for update action
}

/**
 * Docora API response types
 */
export interface DocoraRegisterResponse {
  repository_id: string
  github_url: string
  owner: string
  name: string
  is_private: boolean
  created_at: string
}

/**
 * Webhook action types
 */
export type DocoraAction = "create" | "update" | "delete"

/**
 * Verify HMAC-SHA256 signature from Docora webhook
 *
 * Docora signs webhooks using: HMAC-SHA256(client_auth_key, "{timestamp}.{body}")
 * The signature header format is: "sha256={hex_signature}"
 */
export async function verifyDocoraSignature(
  body: string,
  signature: string,
  timestamp: string,
  authKey: string
): Promise<boolean> {
  // Check signature format
  if (!signature.startsWith("sha256=")) {
    console.warn("Invalid signature format: missing sha256= prefix")
    return false
  }

  const providedSignature = signature.slice(7) // Remove "sha256=" prefix

  // Check timestamp is not too old (5 minute window)
  const timestampNum = parseInt(timestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 5 * 60 // 5 minutes

  if (isNaN(timestampNum) || now - timestampNum > maxAge) {
    console.warn("Timestamp too old or invalid:", { timestamp, now, diff: now - timestampNum })
    return false
  }

  // Reconstruct signed message: "{timestamp}.{body}"
  const message = `${timestamp}.${body}`

  // Calculate expected HMAC-SHA256
  const encoder = new TextEncoder()
  const keyData = encoder.encode(authKey)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData)
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Constant-time comparison
  if (providedSignature.length !== expectedSignature.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < providedSignature.length; i++) {
    result |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
  }

  return result === 0
}

/**
 * Call Docora API
 *
 * @param endpoint - API endpoint (e.g., "/api/repositories")
 * @param method - HTTP method
 * @param body - Request body (for POST/PUT)
 */
export async function docoraApiCall<T = unknown>(
  endpoint: string,
  method: "GET" | "POST" | "DELETE",
  body?: object
): Promise<{ data: T | null; error: string | null; status: number }> {
  const apiUrl = Deno.env.get("DOCORA_API_URL")
  const token = Deno.env.get("DOCORA_TOKEN")

  if (!apiUrl || !token) {
    return {
      data: null,
      error: "DOCORA_API_URL or DOCORA_TOKEN not configured",
      status: 500,
    }
  }

  try {
    const url = `${apiUrl}${endpoint}`
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Docora API error: ${response.status} - ${errorText}`)
      return {
        data: null,
        error: `Docora API error: ${response.status} - ${errorText}`,
        status: response.status,
      }
    }

    // DELETE returns 204 No Content
    if (response.status === 204) {
      return { data: null, error: null, status: 204 }
    }

    const data = await response.json() as T
    return { data, error: null, status: response.status }
  } catch (error) {
    console.error("Docora API call failed:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Register a repository with Docora
 *
 * @param githubUrl - Full GitHub URL (e.g., "https://github.com/owner/repo")
 * @param githubToken - Optional GitHub access token for private repos
 */
export async function registerRepository(
  githubUrl: string,
  githubToken?: string | null
): Promise<{ repositoryId: string | null; error: string | null }> {
  const body: { github_url: string; github_token?: string } = {
    github_url: githubUrl,
  }

  if (githubToken) {
    body.github_token = githubToken
  }

  const result = await docoraApiCall<DocoraRegisterResponse>(
    "/api/repositories",
    "POST",
    body
  )

  if (result.error) {
    return { repositoryId: null, error: result.error }
  }

  return {
    repositoryId: result.data?.repository_id || null,
    error: null,
  }
}

/**
 * Unregister a repository from Docora
 *
 * @param repositoryId - Docora repository ID
 */
export async function unregisterRepository(
  repositoryId: string
): Promise<{ error: string | null }> {
  const result = await docoraApiCall(
    `/api/repositories/${repositoryId}`,
    "DELETE"
  )

  return { error: result.error }
}

/**
 * Check if a file is an image based on extension
 */
export function isImageFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() || ""
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
}

/**
 * Check if a file is a markdown file
 */
export function isMarkdownFile(path: string): boolean {
  return path.endsWith(".md")
}

/**
 * Check if a file is a lumioignore file
 */
export function isLumioIgnoreFile(path: string): boolean {
  return path === ".lumioignore" || path.endsWith("/.lumioignore")
}

/**
 * Get content type from file extension
 */
export function getContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || ""
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  }
  return types[ext] || "application/octet-stream"
}

/**
 * Decode base64 content to Uint8Array
 */
export function decodeBase64(content: string): Uint8Array {
  const binaryString = atob(content.replace(/\n/g, ""))
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Generate SHA-256 hash of text content
 */
export async function hashTextContent(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Generate SHA-256 hash of binary content (truncated to 16 chars for filenames)
 */
export async function hashBinaryContent(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16)
}
