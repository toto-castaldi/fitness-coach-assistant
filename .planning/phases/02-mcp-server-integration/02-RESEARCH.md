# Phase 2: MCP Server Integration - Research

**Researched:** 2026-01-28
**Domain:** Supabase Edge Functions + MCP Protocol
**Confidence:** HIGH

## Summary

This phase requires minimal research as it involves extending an existing, well-structured MCP server implementation. The task is mechanical: add `is_group` field exposure in read operations (resources and read tools) and write operations (mutation tools).

The current `helix-mcp` Edge Function at `supabase/functions/helix-mcp/index.ts` already:
- Has a clear pattern for resource reads with session exercises
- Has tool definitions with input schemas for session exercise operations
- Has tool handlers that build update objects from optional parameters

**Primary recommendation:** Follow existing patterns exactly. Add `is_group` to session_exercises queries in resources, add optional `is_group` parameter to tool schemas and handlers.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions | Current | Serverless runtime | Already in use |
| @supabase/supabase-js | v2 | Database client | Already in use |
| Deno runtime | Current | TypeScript execution | Supabase standard |

### Supporting
No additional libraries needed. All functionality exists in current codebase.

### Alternatives Considered
N/A - This is an extension of existing code, not a new implementation.

## Architecture Patterns

### Existing Code Structure
```
supabase/functions/helix-mcp/
└── index.ts              # ~1900 lines - monolithic MCP server
    ├── Types             # Lines 20-55
    ├── Authentication    # Lines 58-130
    ├── Helper Functions  # Lines 134-166
    ├── Resource Templates # Lines 184-204
    ├── Tool Definitions  # Lines 207-438
    ├── Resource Handlers # Lines 482-778
    ├── Tool Handlers     # Lines 784-1345
    ├── Prompt Handlers   # Lines 1351-1620
    └── Main Handler      # Lines 1812-1945
```

### Pattern 1: Session Exercise Fields in Resources
**What:** Resources that fetch session exercises include all relevant fields
**When to use:** Reading session_exercises from any resource
**Example:**
```typescript
// Current pattern in helix://clients/{id}/sessions (line 552-554)
exercises:session_exercises(
  id, order_index, sets, reps, weight_kg, duration_seconds, notes, completed, skipped,
  exercise:exercises(id, name)
)
// After: add is_group to the field list
```

### Pattern 2: Tool Input Schema Definition
**What:** Tools define optional parameters in inputSchema.properties
**When to use:** Any tool parameter that has a default value
**Example:**
```typescript
// Current pattern in add_session_exercise (lines 349-365)
{
  name: "add_session_exercise",
  inputSchema: {
    type: "object",
    properties: {
      session_id: { type: "string", description: "ID della sessione" },
      // ... other fields ...
      notes: { type: "string", description: "Note sull'esercizio" },
      // After: add is_group here
    },
    required: ["session_id", "exercise_id"],
  },
}
```

### Pattern 3: Tool Handler Parameter Extraction
**What:** Handlers extract optional parameters and build update objects
**When to use:** Any tool that updates session_exercises
**Example:**
```typescript
// Current pattern in update_session_exercise (lines 1189-1208)
const updates: Record<string, unknown> = {}
if (sets !== undefined) updates.sets = sets
if (reps !== undefined) updates.reps = reps
// ... etc
// After: add is_group check
```

### Pattern 4: Insert with Optional Fields
**What:** Insert operations use optional fields with null/false defaults
**When to use:** add_session_exercise, create_training_plan, duplicate_session
**Example:**
```typescript
// Current pattern in add_session_exercise (lines 1165-1179)
.insert({
  session_id,
  exercise_id,
  // ...
  completed: false,
  skipped: false,
  // After: add is_group: is_group || false
})
```

### Anti-Patterns to Avoid
- **Breaking existing functionality:** All changes must be backward compatible
- **Changing required parameters:** is_group must remain optional with default false
- **Missing field in any location:** Must add to ALL places that reference session_exercises

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom validation | MCP inputSchema | Already validated by protocol |
| Default values | Complex conditionals | `|| false` pattern | Consistent with existing code |

**Key insight:** The existing patterns are proven and consistent. Follow them exactly.

## Common Pitfalls

### Pitfall 1: Missing Field in Some Queries
**What goes wrong:** is_group added to some queries but not all
**Why it happens:** Multiple locations select session_exercises fields
**How to avoid:** Comprehensive search for all session_exercises queries
**Warning signs:** Some resources return is_group, others don't

### Pitfall 2: Forgetting duplicate_session Handler
**What goes wrong:** Duplicated sessions lose is_group flag
**Why it happens:** duplicate_session copies exercise properties manually
**How to avoid:** Add is_group to both the select AND insert in duplicate_session
**Warning signs:** Duplicated sessions have all exercises as individual

### Pitfall 3: create_training_plan Schema Mismatch
**What goes wrong:** AI provides is_group but tool rejects it
**Why it happens:** Schema in exercises array items doesn't include is_group
**How to avoid:** Add is_group to the nested exercise object schema
**Warning signs:** Tool validation errors when AI tries to use is_group

## Code Examples

### Example 1: Resource Session Exercise Fields
```typescript
// Pattern used in helix://clients/{id}/sessions, helix://sessions/date/{date}, helix://today
// Add is_group after skipped in the field list:
exercises:session_exercises(
  id, order_index, sets, reps, weight_kg, duration_seconds, notes, completed, skipped, is_group,
  exercise:exercises(id, name)
)
```

### Example 2: Tool Schema with is_group
```typescript
// For add_session_exercise and update_session_exercise
is_group: { type: "boolean", description: "Esercizio di gruppo" }
```

### Example 3: Tool Handler Update
```typescript
// In update_session_exercise handler
const { session_exercise_id, sets, reps, weight_kg, duration_seconds, notes, completed, skipped, is_group } = args as {
  // ... existing types ...
  is_group?: boolean
}

const updates: Record<string, unknown> = {}
// ... existing checks ...
if (is_group !== undefined) updates.is_group = is_group
```

### Example 4: Insert Operation
```typescript
// In add_session_exercise handler
.insert({
  session_id,
  exercise_id,
  order_index: finalOrderIndex,
  sets: sets || null,
  reps: reps || null,
  weight_kg: weight_kg || null,
  duration_seconds: duration_seconds || null,
  notes: notes || null,
  completed: false,
  skipped: false,
  is_group: is_group || false,  // NEW
})
```

### Example 5: create_training_plan Nested Schema
```typescript
// In exercises array item schema
{
  type: "object",
  properties: {
    exercise_name: { type: "string", description: "Nome dell'esercizio" },
    sets: { type: "number" },
    reps: { type: "number" },
    weight_kg: { type: "number" },
    duration_seconds: { type: "number" },
    notes: { type: "string" },
    is_group: { type: "boolean" },  // NEW
  },
  required: ["exercise_name"],
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No group exercises | is_group field in DB | Phase 1 (2026-01-28) | Need MCP exposure |

**Deprecated/outdated:**
- N/A - This is new functionality

## Open Questions

None - implementation path is clear from existing patterns.

## Locations Requiring Changes

### Resources (Read Operations)

| Location | Line | Change Required |
|----------|------|-----------------|
| `helix://clients/{id}/sessions` | ~552 | Add is_group to field list |
| `helix://sessions/date/{date}` | ~700-704 | Add is_group to field list |
| `helix://sessions/{id}` | ~722-724 | Already uses `*`, should include is_group automatically |
| `helix://today` | ~765-768 | Add is_group to field list |
| `get_session` tool | ~917 | Already uses `*`, should include is_group automatically |

### Tools (Write Operations)

| Tool | Change Required |
|------|-----------------|
| `add_session_exercise` | Add is_group to schema and handler |
| `update_session_exercise` | Add is_group to schema and handler |
| `duplicate_session` | Add is_group to select and insert |
| `create_training_plan` | Add is_group to exercises array item schema and handler |

### Queries Using Wildcard (*)

The following already use `*` for session_exercises and should automatically include is_group:
- `helix://sessions/{id}` (line 721-724)
- `get_session` tool (line 913-919)

However, verification is needed during testing.

## Sources

### Primary (HIGH confidence)
- `/home/toto/scm-projects/helix/supabase/functions/helix-mcp/index.ts` - Current MCP implementation
- `/home/toto/scm-projects/helix/supabase/migrations/00000000000017_add_is_group.sql` - DB schema
- `/home/toto/scm-projects/helix/src/shared/types/index.ts` - TypeScript types showing is_group already defined

### Secondary (MEDIUM confidence)
- `/home/toto/scm-projects/helix/CLAUDE.md` - Project documentation with MCP server details

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing stack, no changes
- Architecture: HIGH - Following existing patterns exactly
- Pitfalls: HIGH - Identified from code analysis

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (stable domain, no external dependencies)
