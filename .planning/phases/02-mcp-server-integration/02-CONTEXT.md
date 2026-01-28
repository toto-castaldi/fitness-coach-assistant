# Phase 2: MCP Server Integration - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Esporre il campo `is_group` (già presente in DB da Phase 1) attraverso il server MCP esistente. Lettura nelle resources, scrittura nei tools.

</domain>

<decisions>
## Implementation Decisions

### No Discussion Needed

Phase skipped discussion — implementation is mechanical:
- Add `is_group` to session exercise data in resource responses
- Add optional `is_group` parameter to relevant tools
- Default to `false` if not provided (matching DB default)

### Claude's Discretion
- All implementation details — no user preferences captured
- Follow existing MCP server patterns

</decisions>

<specifics>
## Specific Ideas

No specific requirements — follow existing patterns in `helix-mcp` Edge Function.

</specifics>

<deferred>
## Deferred Ideas

None — discussion skipped.

</deferred>

---

*Phase: 02-mcp-server-integration*
*Context gathered: 2026-01-28*
