import { supabase } from './supabase'

/**
 * Resolves relative image paths in markdown content to Supabase Storage URLs.
 *
 * Images are stored in the bucket with their original path structure:
 * lumio-images/{user_id}/{repo_id}/{original_path}
 *
 * Markdown references like `../assets/image.png` from `cards/file.md`
 * are resolved to `assets/image.png` and then to the full storage URL.
 */
export function resolveImagePaths(
  content: string,
  cardFilePath: string,
  userId: string,
  repositoryId: string
): string {
  // Regex to find markdown images: ![alt](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g

  return content.replace(imageRegex, (match, alt, imagePath) => {
    // Skip external URLs
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return match
    }

    // Resolve the relative path
    const resolvedPath = resolveRelativePath(cardFilePath, imagePath)

    // Build the storage URL
    const storagePath = `${userId}/${repositoryId}/${resolvedPath}`
    const { data } = supabase.storage.from('lumio-images').getPublicUrl(storagePath)

    return `![${alt}](${data.publicUrl})`
  })
}

/**
 * Resolves a relative or absolute path from a base file path.
 *
 * Examples:
 * - base: "cards/file.md", relative: "../assets/img.png" -> "assets/img.png"
 * - base: "docs/guide/file.md", relative: "../../assets/img.png" -> "assets/img.png"
 * - base: "file.md", relative: "assets/img.png" -> "assets/img.png"
 * - base: "cards/file.md", relative: "./img.png" -> "cards/img.png"
 * - base: "cards/file.md", absolute: "/assets/img.png" -> "assets/img.png"
 */
function resolveRelativePath(baseFilePath: string, imagePath: string): string {
  // Handle absolute paths (starting with /)
  if (imagePath.startsWith('/')) {
    return imagePath.slice(1) // Remove leading slash
  }

  // Get the directory of the base file
  const baseParts = baseFilePath.split('/')
  baseParts.pop() // Remove filename, keep directory parts

  // Handle the relative path
  const relativeParts = imagePath.split('/')

  for (const part of relativeParts) {
    if (part === '..') {
      // Go up one directory
      baseParts.pop()
    } else if (part === '.') {
      // Stay in current directory (no-op)
    } else {
      // Add to path
      baseParts.push(part)
    }
  }

  return baseParts.join('/')
}
