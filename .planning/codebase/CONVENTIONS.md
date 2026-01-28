# Coding Conventions

**Analysis Date:** 2026-01-28

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `ExerciseForm.tsx`, `SessionExerciseCard.tsx`)
- Utilities/hooks: camelCase (e.g., `useSessions.ts`, `useAuth.ts`, `utils.ts`)
- Pages: PascalCase (e.g., `ClientDetail.tsx`, `LiveCoaching.tsx`)
- Shared code: descriptive names in `src/shared/` (e.g., `liveCoachingStorage.ts`, `supabase.ts`)
- Type definition files: `index.ts` in type directories (e.g., `src/types/index.ts`, `src/shared/types/index.ts`)

**Functions:**
- camelCase throughout (e.g., `calculateAge`, `getInitials`, `stringToHue`, `formatDate`)
- Hook names prefixed with `use` (e.g., `useAuth`, `useSessions`, `useExercises`, `useLiveCoaching`)
- Exported functions are PascalCase only for React components

**Variables:**
- camelCase for all variables: `userId`, `clientData`, `currentValue`, `isSubmitting`, `showPicker`
- State variables: clear intent names like `loading`, `error`, `isSubmitting`, `showForm`, `selectedId`
- No Hungarian notation or type prefixes
- Prefix boolean variables with `is`, `show`, `has`, or similar (e.g., `isFirst`, `showCardPicker`, `hasProgress`)

**Types/Interfaces:**
- PascalCase for all type names (e.g., `Client`, `SessionWithDetails`, `ExerciseWithDetails`, `Gender`)
- Suffix with type intent when needed:
  - `...Insert` for insert types (e.g., `ClientInsert`, `SessionExerciseInsert`)
  - `...Update` for update types (e.g., `ClientUpdate`, `SessionExerciseUpdate`)
  - `...Details` for enriched types (e.g., `SessionWithDetails`, `ExerciseWithDetails`)
  - `...WithRepository` for related data (e.g., `LumioLocalCardWithRepository`)
- Type unions: lowercase with pipe separator (e.g., `'planned' | 'completed'`, `'male' | 'female'`)
- Named exports for constants: `UPPERCASE_WITH_UNDERSCORES` (e.g., `AI_MODELS`, `STORAGE_KEY_PREFIX`)

**Database columns:**
- snake_case following PostgreSQL convention (e.g., `user_id`, `session_date`, `current_exercise_index`, `lumio_card_id`)

## Code Style

**Formatting:**
- ESLint (v9.39.1) with TypeScript ESLint configuration
- No dedicated Prettier config; ESLint handles all formatting rules
- 2-space indentation (standard for JavaScript)
- Line length: no strict limit, but reasonable (~100-120 characters for readability)

**Linting:**
- Config file: `eslint.config.js` (flat config format)
- Extends: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Targets TypeScript files: `**/*.{ts,tsx}`
- Strict mode enabled in TypeScript

**TypeScript:**
- Target: `ES2022`
- Strict mode: enabled
- JSX mode: `react-jsx` (automatic JSX transform, no React import needed)
- Module resolution: `bundler`
- Path aliases: `@/*` maps to `src/*`
- Compiler options enforce:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`
  - `noUncheckedSideEffectImports: true`

## Import Organization

**Order:**
1. React/framework imports (`react`, `react-dom`, `react-router-dom`)
2. Third-party libraries (`lucide-react`, `zod`, `@supabase/supabase-js`, etc.)
3. Internal absolute path imports (`@/...`)
4. Local relative imports (same directory)
5. Type imports (use `import type {...}` syntax)

**Path Aliases:**
- `@/*` for all `src/` imports
- Never use relative paths like `../../../` in src/ files

**Example from codebase:**
```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExerciseWithDetails, ExerciseInsert } from '@/types'
```

## Error Handling

**Patterns:**
- Async operations use destructured error pattern from Supabase:
  ```typescript
  const { data, error } = await supabase.from('table').select('*')
  if (error) {
    setError(error.message)
  } else {
    // process data
  }
  ```

- Throw errors for critical initialization failures:
  ```typescript
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  ```

- React hooks capture errors in state:
  ```typescript
  const [error, setError] = useState<string | null>(null)
  setError(null) // reset before operations
  ```

- Try-catch for localStorage and client-side operations:
  ```typescript
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error('Failed to save state:', error)
  }
  ```

- Error type checking in catch blocks:
  ```typescript
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    setSaveError(message)
  }
  ```

- Status tracking for operations:
  ```typescript
  type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  ```

## Logging

**Framework:** `console` (no external logging library)

**Patterns:**
- `console.error()` for failures (e.g., storage operations, login errors)
- Log format: descriptive message + error object
  ```typescript
  console.error('Failed to save live coaching state:', error)
  ```
- No `console.log()` for production code (use in development/debugging only)
- Keep all console usage in library/utility functions or error paths

## Comments

**When to Comment:**
- JSDoc for public functions and hooks that need documentation
- Inline comments for non-obvious business logic or complex calculations
- Comments for workarounds or temporary solutions
- Keep comments concise and explain "why", not "what"

**JSDoc/TSDoc:**
```typescript
/**
 * Generate a deterministic color from a string (e.g., client name)
 * Returns a hue value (0-360) for use with HSL
 */
export function stringToHue(str: string): number {
  // ...
}

/**
 * Load live coaching state from localStorage
 * Returns null if no state exists or if the state is stale (>24h)
 */
export function loadLiveCoachingState(userId: string): LiveCoachingState | null {
  // ...
}
```

- Used for exported functions and utilities
- Document parameters, return type, and important behavior
- No @param/@returns annotations in simple cases (TypeScript handles this)

**Inline Comments:**
- Explain business logic: `// Sort exercises by order_index`
- Mark sections: `// Change exercise to a different one from catalog`
- Used sparingly; code should be self-documenting

## Function Design

**Size:**
- Average function: 20-50 lines
- Hooks: 50-100+ lines acceptable (UI state management)
- Large files indicate multiple responsibilities (e.g., `useLiveCoaching.ts` at 716 lines handles state, saving, and UI coordination)

**Parameters:**
- Use interfaces for multiple related parameters:
  ```typescript
  interface FetchSessionsOptions {
    clientId?: string
    status?: 'planned' | 'completed'
    fromDate?: string
    toDate?: string
  }
  export function useSessions(options: FetchSessionsOptions = {})
  ```
- Component props as interface:
  ```typescript
  interface ExerciseFormProps {
    exercise?: ExerciseWithDetails
    existingTags?: string[]
    onSubmit: (data: ExerciseInsert, tags: string[]) => Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
  }
  ```

**Return Values:**
- Functions return typed objects or unions:
  ```typescript
  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }
  ```
- Async functions return data or throw errors
- Hooks return state and callback functions

## Module Design

**Exports:**
- Named exports for functions and components:
  ```typescript
  export function ExerciseForm() { ... }
  export function useAuth() { ... }
  ```
- Default exports only for page components (when used with React Router)
- Type exports: `export type Client = ...` or `export interface Client { ... }`
- Constants exported as named exports: `export const AI_MODELS = [...]`

**Barrel Files:**
- `src/types/index.ts` exports all type definitions
- `src/shared/types/index.ts` exports shared types
- No barrel files in component directories; import from specific files

**Directory Structure:**
- Shared code: `src/shared/` (lib, hooks, components, types, CSS)
- Feature code: `src/` with specific directories:
  - `components/` - reusable components (sub-folders: `ui/`, `clients/`, `sessions/`, etc.)
  - `hooks/` - custom hooks specific to main app
  - `lib/` - utilities specific to main app
  - `pages/` - page components
  - `types/` - type definitions
- Separate entry point: `src/live/` for tablet app

## React Patterns

**Functional Components:**
- All components are functional (no class components)
- Use hooks for state and effects
- Props are destructured in function signature

**State Management:**
- React useState for local component state
- Custom hooks (useSessions, useExercises, etc.) for data fetching and business logic
- No global state manager (Redux, Zustand); hooks handle data layer

**Effects:**
- useEffect for data fetching with cleanup:
  ```typescript
  useEffect(() => {
    if (!id || loadedRef.current) return
    loadedRef.current = true
    // fetch logic
  }, [id])
  ```
- useCallback for stable callback references in dependency arrays
- useRef for tracking initialized state and memoization

**Forms:**
- react-hook-form with Zod validation:
  ```typescript
  const schema = z.object({
    name: z.string().min(1, 'Required'),
  })
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  ```

## Zod Validation

- Used for form validation and runtime type checking
- Schema defined near component or in separate validation module
- Type inference: `type FormData = z.infer<typeof schema>`

## UI Components

- All UI components from `src/shared/components/ui/` (shadcn/ui primitives)
- Tailwind CSS for styling with CSS modules avoided
- Utility function `cn()` for conditional class merging:
  ```typescript
  import { cn } from '@/shared/lib/utils'
  className={cn('base-class', active && 'active-class')}
  ```

---

*Convention analysis: 2026-01-28*
