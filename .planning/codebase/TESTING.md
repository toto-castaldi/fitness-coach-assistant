# Testing Patterns

**Analysis Date:** 2026-01-28

## Test Framework

**Runner:**
- Not detected - no test framework configured or test files present

**Assertion Library:**
- Not applicable

**Run Commands:**
- No test commands in `package.json`

**Note:** The project has no automated test suite. All testing is manual or through development iteration.

## Test File Organization

**Status:** Not applicable - no test files exist in the codebase.

**Expected location if testing were implemented:**
- Co-located pattern: `*.test.ts` or `*.spec.tsx` alongside source files
- Or separate: `tests/` or `__tests__/` directory

**Naming pattern (if implemented):**
- `ComponentName.test.tsx` for component tests
- `hookName.test.ts` for hook tests
- `functionName.test.ts` for utility tests

## Test Structure

**Current State:**
The codebase contains no automated tests. Testing relies on:
1. **Manual QA**: Testing the application through the browser UI
2. **Type Safety**: TypeScript strict mode catches many errors
3. **Linting**: ESLint enforces code quality rules
4. **Development**: Hot reload during `npm run dev` enables rapid iteration

## Mocking

**Not Implemented.**

If testing were added, expected patterns would be:
- Mock Supabase client for data operations
- Mock localStorage for state persistence
- Mock window.location for OAuth redirects
- Mock react-router useNavigate and useParams hooks

## Fixtures and Factories

**Not Implemented.**

**Database seed data** does exist:
- Location: `supabase/seed.sql`
- Contains: 15 default exercises with tags
- Usage: Executed with `npm run supabase:reset` for local development

For local testing during development, coaches can use `npm run dev:local` which:
1. Starts local Supabase instance
2. Applies migrations from `supabase/migrations/`
3. Runs seed data from `supabase/seed.sql`
4. Starts Edge Functions with environment from `supabase/.env`

## Coverage

**Requirements:** Not enforced

**Tools:** No coverage tracking or reporting

## Test Types

**Unit Tests:**
- Not applicable - no test framework

**Integration Tests:**
- Manual testing with local Supabase (`npm run dev:local`)
- Test flow: UI → React → Hooks → Supabase client → Local database

**E2E Tests:**
- Not implemented
- Testing occurs manually in browser against `localhost:5173` (main app) and `localhost:5174` (tablet app)

## Development Testing Patterns

**Manual Testing Workflow:**

1. **Start local environment:**
   ```bash
   npm run dev:local
   ```

2. **Browser testing:**
   - Main app: `http://localhost:5173`
   - Tablet app: `http://localhost:5174`
   - Supabase Studio: `http://localhost:54323` (view/edit data)

3. **Rebuild and clear cache:**
   ```bash
   npm run dev:clean        # Main app with full cache clear
   npm run dev:live:clean   # Tablet app with full cache clear
   ```

4. **Browser cache clearing:**
   - For development issues: `Ctrl+Shift+Delete` → Empty cache → Reload
   - Or: Right-click refresh → "Empty cache and hard reload"

## Type Safety as Primary Quality Mechanism

**TypeScript Configuration:**
- Strict mode enabled
- Path aliases prevent import errors: `@/*` always works
- Type inference on state and props
- Zod runtime validation on forms

**Example validation pattern:**
```typescript
const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  description: z.string().optional(),
})

type ExerciseFormData = z.infer<typeof exerciseSchema>

const form = useForm<ExerciseFormData>({
  resolver: zodResolver(exerciseSchema),
})
```

This ensures:
- Form data matches TypeScript type at compile time
- Runtime validation catches invalid input
- IDE autocomplete for form fields

## Edge Function Testing

**Location:** `supabase/functions/`

Edge Functions are tested manually:

**Test MCP Server in Locale (Milestone 12):**

1. Start Edge Functions with environment:
   ```bash
   npx supabase functions serve --env-file supabase/.env
   ```

2. Generate test API key:
   ```bash
   TEST_API_KEY="hx_test_$(openssl rand -hex 16)"
   HASH=$(echo -n "$TEST_API_KEY" | sha256sum | cut -d' ' -f1)
   ```

3. Insert in test database:
   ```bash
   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
     "INSERT INTO public.coach_ai_settings (user_id, helix_mcp_api_key_hash)
      VALUES ('<USER_ID>', '$HASH')
      ON CONFLICT (user_id) DO UPDATE SET helix_mcp_api_key_hash = '$HASH';"
   ```

4. Test with curl:
   ```bash
   curl -s -X POST http://127.0.0.1:54321/functions/v1/helix-mcp \
     -H "Content-Type: application/json" \
     -H "X-Helix-API-Key: $TEST_API_KEY" \
     -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1, ...}' | jq .
   ```

## Common Testing Scenarios (Manual)

**Client Management:**
1. Create client with form validation
2. Verify data persists in Supabase
3. View in client list and detail page
4. Edit client information
5. Delete client (if applicable)

**Session Planning:**
1. Create session for a client
2. Add exercises from catalog
3. Modify sets/reps/weight
4. Save session
5. Verify data in session list

**Live Coaching (Tablet):**
1. Select client and date
2. Progress through exercises
3. Mark complete/skip
4. Save state to localStorage
5. Resume interrupted session

**Data Sync:**
1. Modify data in Supabase Studio
2. Refresh app (browser reload)
3. Verify UI reflects changes
4. Test with `npm run dev:local` after migrations

## Documentation for Quality Assurance

**Product Specs:** `docs/SPECS.md` - Feature requirements and behavior
**Technical Specs:** `docs/TECH-SPECS.md` - Implementation details
**Roadmap:** `docs/ROADMAP.md` - Step-by-step implementation tasks
**Local Dev:** `docs/LOCAL-DEVELOPMENT.md` - Setup and troubleshooting

## Known Limitations

1. **No unit test coverage** - All code relies on type system and manual testing
2. **No E2E test framework** - Manual browser testing required for features
3. **No integration test suite** - Testing against real local Supabase instance only
4. **No CI/CD test pipeline** - Tests only run on developer machines during development

## Recommended Testing Additions

**Priority:** Add Vitest for unit testing React hooks and utilities:
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

**Target coverage:**
- Hooks: `useSessions`, `useExercises`, `useAuth`, `useLiveCoaching`
- Utilities: `calculateAge`, `formatDate`, `stringToHue`, `getInitials`
- Form validation: Zod schema tests
- State management: localStorage functions

**Integration tests** could use Vitest + Supabase local instance to test:
- API calls with real database
- Session creation and updates
- Exercise cataloging and filtering
- User authentication flow

---

*Testing analysis: 2026-01-28*
