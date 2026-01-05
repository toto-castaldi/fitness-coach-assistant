/**
 * GitHub API Helper
 * Utilities for interacting with GitHub API to sync Lumio repositories
 */

export interface GitHubTreeItem {
  path: string
  mode: string
  type: "blob" | "tree"
  sha: string
  size?: number
  url: string
}

export interface GitHubTree {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
}

export interface ParsedGitHubUrl {
  owner: string
  repo: string
  branch?: string
  path?: string
}

/**
 * Parse a GitHub URL to extract owner, repo, branch, and path
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/tree/branch/path
 * - https://raw.githubusercontent.com/owner/repo/branch/path
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  try {
    const parsed = new URL(url)

    // Handle raw.githubusercontent.com
    if (parsed.hostname === "raw.githubusercontent.com") {
      const parts = parsed.pathname.split("/").filter(Boolean)
      if (parts.length >= 3) {
        return {
          owner: parts[0],
          repo: parts[1],
          branch: parts[2],
          path: parts.slice(3).join("/") || undefined,
        }
      }
    }

    // Handle github.com
    if (parsed.hostname === "github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean)
      if (parts.length >= 2) {
        const result: ParsedGitHubUrl = {
          owner: parts[0],
          repo: parts[1],
        }

        // Check for /tree/branch/path format
        if (parts[2] === "tree" && parts.length >= 4) {
          result.branch = parts[3]
          if (parts.length > 4) {
            result.path = parts.slice(4).join("/")
          }
        }

        return result
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Build GitHub API headers with optional auth token
 */
function buildHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "FitnessCoachAssistant/1.0",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export interface LatestCommitInfo {
  sha: string
  date: string // ISO date string
}

/**
 * Get the latest commit hash for a repository branch
 */
export async function getLatestCommitHash(
  owner: string,
  repo: string,
  branch: string,
  token?: string | null
): Promise<string> {
  const info = await getLatestCommitInfo(owner, repo, branch, token)
  return info.sha
}

/**
 * Get the latest commit hash and date for a repository branch
 */
export async function getLatestCommitInfo(
  owner: string,
  repo: string,
  branch: string,
  token?: string | null
): Promise<LatestCommitInfo> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`
  const response = await fetch(url, { headers: buildHeaders(token) })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository or branch not found: ${owner}/${repo}@${branch}`)
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid or expired GitHub access token")
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const commit: GitHubCommit = await response.json()
  return {
    sha: commit.sha,
    date: commit.commit.author.date,
  }
}

/**
 * Get the file tree of a repository
 */
export async function getRepositoryTree(
  owner: string,
  repo: string,
  branch: string,
  token?: string | null
): Promise<GitHubTreeItem[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  const response = await fetch(url, { headers: buildHeaders(token) })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository or branch not found: ${owner}/${repo}@${branch}`)
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid or expired GitHub access token")
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const tree: GitHubTree = await response.json()

  if (tree.truncated) {
    console.warn(`Repository tree was truncated: ${owner}/${repo}`)
  }

  return tree.tree
}

/**
 * Get raw file content from a repository
 */
export async function getRawFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token?: string | null
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`

  const headers: Record<string, string> = {
    Accept: "text/plain",
    "User-Agent": "FitnessCoachAssistant/1.0",
  }

  // For private repos, use GitHub API instead
  if (token) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    const response = await fetch(apiUrl, { headers: buildHeaders(token) })

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    // Content is base64 encoded - decode to UTF-8 properly
    const binaryString = atob(data.content.replace(/\n/g, ""))
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new TextDecoder("utf-8").decode(bytes)
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

/**
 * Fetch raw binary content (for images)
 */
export async function getRawBinaryContent(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token?: string | null
): Promise<{ data: ArrayBuffer; contentType: string }> {
  if (token) {
    // For private repos, use GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    const response = await fetch(apiUrl, { headers: buildHeaders(token) })

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    // Content is base64 encoded
    const binaryString = atob(data.content.replace(/\n/g, ""))
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Determine content type from extension
    const ext = path.split(".").pop()?.toLowerCase() || ""
    const contentType = getContentType(ext)

    return { data: bytes.buffer, contentType }
  }

  // For public repos, use raw.githubusercontent.com
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FitnessCoachAssistant/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get("Content-Type") || "application/octet-stream"
  const data = await response.arrayBuffer()

  return { data, contentType }
}

/**
 * Get content type from file extension
 */
function getContentType(ext: string): string {
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
 * Validate access to a GitHub repository
 */
export async function validateGitHubAccess(
  owner: string,
  repo: string,
  token?: string | null
): Promise<{ valid: boolean; error?: string; isPrivate?: boolean }> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}`
    const response = await fetch(url, { headers: buildHeaders(token) })

    if (response.status === 404) {
      // Could be private without token
      if (!token) {
        return {
          valid: false,
          error: "Repository not found. If it's private, please provide an access token.",
        }
      }
      return { valid: false, error: "Repository not found" }
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: "Invalid or expired access token" }
    }

    if (!response.ok) {
      return { valid: false, error: `GitHub API error: ${response.status}` }
    }

    const data = await response.json()
    return { valid: true, isPrivate: data.private }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Build a GitHub repository URL
 */
export function buildGitHubUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`
}

/**
 * Build a raw content URL
 */
export function buildRawUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}
