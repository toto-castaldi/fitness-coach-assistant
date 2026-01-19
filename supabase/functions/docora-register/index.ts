import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import {
  registerRepository,
  unregisterRepository,
} from "../_shared/docora.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface RequestBody {
  action: "register" | "unregister"
  repositoryId: string      // Helix internal UUID
  githubUrl?: string        // Required for register
  githubToken?: string      // Optional, for private repos
}

interface LumioRepository {
  id: string
  user_id: string
  github_owner: string
  github_repo: string
  access_token: string | null
  docora_repository_id: string | null
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

    // Validate JWT and get user
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Parse request body
    const body: RequestBody = await req.json()
    const { action, repositoryId, githubUrl, githubToken } = body

    if (!action || !repositoryId) {
      return new Response(
        JSON.stringify({ error: "action and repositoryId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verify user owns the repository
    const { data: repo, error: repoError } = await supabase
      .from("lumio_repositories")
      .select("*")
      .eq("id", repositoryId)
      .eq("user_id", user.id)
      .single()

    if (repoError || !repo) {
      return new Response(
        JSON.stringify({ error: "Repository not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const repository = repo as LumioRepository

    if (action === "register") {
      // Check if already registered
      if (repository.docora_repository_id) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Repository already registered with Docora",
            docoraRepositoryId: repository.docora_repository_id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Build GitHub URL if not provided
      const repoGithubUrl = githubUrl || `https://github.com/${repository.github_owner}/${repository.github_repo}`

      // Use provided token or stored access_token
      const repoGithubToken = githubToken || repository.access_token

      // Register with Docora
      const result = await registerRepository(repoGithubUrl, repoGithubToken)

      if (result.error) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Update repository with Docora ID
      const { error: updateError } = await supabase
        .from("lumio_repositories")
        .update({
          docora_repository_id: result.repositoryId,
          sync_status: "pending",  // Will be synced by Docora
        })
        .eq("id", repositoryId)

      if (updateError) {
        console.error("Failed to update repository with Docora ID:", updateError)
        return new Response(
          JSON.stringify({ error: "Failed to save Docora registration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Repository registered with Docora",
          docoraRepositoryId: result.repositoryId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (action === "unregister") {
      // Check if registered
      if (!repository.docora_repository_id) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Repository not registered with Docora",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Unregister from Docora
      const result = await unregisterRepository(repository.docora_repository_id)

      if (result.error) {
        console.error("Failed to unregister from Docora:", result.error)
        // Continue anyway - we'll clear the local reference
      }

      // Clear Docora ID from repository
      const { error: updateError } = await supabase
        .from("lumio_repositories")
        .update({ docora_repository_id: null })
        .eq("id", repositoryId)

      if (updateError) {
        console.error("Failed to clear Docora ID:", updateError)
        return new Response(
          JSON.stringify({ error: "Failed to update repository" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Repository unregistered from Docora",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'register' or 'unregister'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Docora Register Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
