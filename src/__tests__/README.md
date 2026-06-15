# Testing Guide — Unit & Integration Tests

## Stack

| Tool | Purpose |
|---|---|
| **Vitest** | Test runner + assertion library (Vite-native, fast HMR in watch mode) |
| **Vue Test Utils** | Component mounting, DOM traversal, event simulation |
| **jsdom** | Headless DOM environment (no browser needed) |
| **Pinia test helpers** | `setActivePinia(createPinia())` for isolated store state |

## Commands

```bash
pnpm test        # Watch mode (dev)
pnpm test run    # Run once (CI)
```

## Architecture Decisions

### Why Vitest over Jest?

- **Vite-native** — shares the same config, no separate bundler setup
- **Faster** — runs tests in parallel with native ESM support
- **Zero config** — works out of the box with TypeScript and Vue SFCs
- **Compatible API** — Jest-style `describe`/`it`/`expect` with `globals: true`

### Why jsdom over a real browser?

- **Speed** — no browser launch overhead, tests run in milliseconds
- **Simplicity** — no WebDriver/Playwright setup for unit tests
- **Sufficient** — covers DOM APIs, events, and rendering without visual rendering

### Test Organization

```
src/__tests__/
├── services/          # Unit tests — pure logic, API mocking
│   ├── booking.service.test.ts
│   └── offer.service.test.ts
└── views/             # Integration tests — component + mocked services
    ├── ServiceRequestDetailView.test.ts
    └── ServiceRequestsView.test.ts
```

## Unit Tests (`src/__tests__/services/`)

**What they test:** Service layer methods that wrap HTTP calls.

**Why this approach:**
- Services are thin API wrappers — mocking `http` isolates them from the network
- Tests verify correct endpoint, params, and response transformation
- Fast (<10ms per file) — no component mounting, no DOM

**Pattern:**
```ts
vi.mock('@/lib/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

// Cast mock for type-safe assertions
const mockedHttp = http as unknown as { get: ReturnType<typeof vi.fn> };

it('returns the first booking for a request', async () => {
  mockedHttp.get.mockResolvedValue({ data: [{ id: 7 }] });
  const result = await bookingService.getBookingByRequestId(12);
  expect(mockedHttp.get).toHaveBeenCalledWith('service-bookings', {
    params: { serviceRequestId: 12 },
  });
  expect(result).toEqual({ id: 7 });
});
```

## Integration Tests (`src/__tests__/views/`)

**What they test:** Vue components with real Pinia stores, Vue Router, and mocked services.

**Why this approach:**
- Components depend on multiple services — mocking each one isolates the component logic
- Real Pinia + Router ensures reactivity and navigation work correctly
- `flushPromises()` + fake timers control async behavior deterministically

**Pattern:**
```ts
// Mock all service dependencies
vi.mock('@/modules/matching/services/offer.service', () => ({
  offerService: { getOffersByRequestId: vi.fn(), acceptOffer: vi.fn() },
}));

// Mount with real router + Pinia
async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/requests/:id', component: ServiceRequestDetailView }],
  });
  router.push('/requests/44');
  await router.isReady();

  return mount(ServiceRequestDetailView, {
    global: { plugins: [router], stubs: { Button: true } },
  });
}

describe('ServiceRequestDetailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    // Set up mock returns...
  });

  it('starts polling when request is pending', async () => {
    await mountView();
    await flushPromises();
    vi.advanceTimersByTime(10_000);
    await flushPromises();
    expect(mockOfferService.getOffersByRequestId.mock.calls.length).toBe(2);
  });
});
```

## What to Test vs What to Skip

| Test | Unit | Integration | E2E |
|---|---|---|---|
| Service API calls + response mapping | ✅ | | |
| Component rendering + user interactions | | ✅ | |
| Pinia store state changes | | ✅ | |
| Polling/timer behavior | | ✅ | |
| Full user workflow (login → register → request) | | | ✅ |
| Cross-page navigation | | | ✅ |
| Backend integration | | | ✅ |

## Adding New Tests

1. **New service?** → Add to `src/__tests__/services/<name>.service.test.ts`
2. **New view?** → Add to `src/__tests__/views/<Name>View.test.ts`
3. **New store?** → Test in integration tests (mount component that uses it)
4. **New workflow?** → Add E2E feature file in `../../e2e/features/` (see `e2e/README.md`)
