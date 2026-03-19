---
name: nextjs-routing
description: "Next.js 16 App Router conventions and rendering strategies. Use when creating routes, pages, layouts, loading states, error boundaries, parallel routes, intercepting routes, or evaluating SSG vs SSR vs ISR vs streaming."
---

# skill: nextjs-routing

## purpose
Guide agents on when and how to use every Next.js 16 App Router convention. Agents should reach for the right mechanism, not default to flat route structures.

## route groups — `(name)/`

Organize routes WITHOUT affecting the URL. Use parentheses around the folder name.

**when to use:**
- separate layout contexts: `(auth)/login` and `(dashboard)/overview` share different root layouts
- group related routes that need a shared layout, loading state, or error boundary
- isolate public vs authenticated sections of the app

```
src/app/
├── (public)/              # no auth required, marketing layout
│   ├── layout.tsx         # public layout (no sidebar, simpler nav)
│   ├── page.tsx           # homepage
│   └── pricing/page.tsx
├── (auth)/                # auth pages, minimal layout
│   ├── layout.tsx         # centered card layout
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/           # authenticated, full app layout
│   ├── layout.tsx         # sidebar + topbar layout, auth check
│   ├── loading.tsx        # falcani shimmer skeleton for all dashboard routes
│   ├── overview/page.tsx
│   ├── orders/
│   │   ├── page.tsx       # /orders (list)
│   │   └── [id]/page.tsx  # /orders/abc123 (detail)
│   └── settings/page.tsx
└── layout.tsx             # root layout (html, body, providers)
```

**URL result:** `(public)`, `(auth)`, `(dashboard)` do NOT appear in URLs. `/login`, `/overview`, `/orders` are the actual paths.

## dynamic segments — `[param]/`

Single dynamic URL segment. The most common dynamic pattern.

**when to use:** resource detail pages, user profiles, any route where one segment varies.

```
src/app/(dashboard)/orders/[id]/page.tsx
// URL: /orders/abc123
// Access: const { id } = await params;
```

**always:**
- validate the param before using it (is it a valid ObjectId? does the resource exist?)
- return `notFound()` from `next/navigation` if the resource doesn't exist
- use `generateMetadata` for dynamic page titles

```typescript
// src/app/(dashboard)/orders/[id]/page.tsx
import { notFound } from "next/navigation";
import { orders } from "@/lib/db/client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const order = await orders.findById(id);
  if (!order) return { title: "Order not found" };
  return { title: `Order ${order.reference}` };
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const order = await orders.findById(id);
  if (!order) notFound();

  return <OrderDetail order={order} />;
}
```

## catch-all segments — `[...slug]/`

Captures multiple URL segments as an array. Use sparingly.

**when to use:**
- documentation or CMS pages with variable depth: `/docs/getting-started/installation`
- catch-all redirect handlers
- better-auth mount: `api/auth/[...all]/route.ts`

```
src/app/docs/[...slug]/page.tsx
// URL: /docs/getting-started/installation
// Access: const { slug } = await params; // ["getting-started", "installation"]
```

**optional catch-all `[[...slug]]/`:** also matches the route WITHOUT any segments. Use when the base path should also render: `/docs` AND `/docs/getting-started` both work.

## parallel routes — `@name/`

Render multiple page components in the same layout simultaneously. Each slot is independently streamable and can have its own loading/error states.

**when to use:**
- dashboard layouts with multiple independent panels (metrics + feed + activity)
- split views where different sections load at different speeds
- modal patterns where the modal content is a separate route

```
src/app/(dashboard)/
├── layout.tsx              # receives { children, metrics, activity } as props
├── @metrics/
│   ├── page.tsx            # metrics panel content
│   └── loading.tsx         # independent loading state
├── @activity/
│   ├── page.tsx            # activity feed content
│   └── loading.tsx         # independent loading state
└── page.tsx                # main content (children slot)
```

```tsx
// layout.tsx
export default function DashboardLayout({
  children,
  metrics,
  activity,
}: {
  children: React.ReactNode;
  metrics: React.ReactNode;
  activity: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <main className="col-span-8">{children}</main>
      <aside className="col-span-4 space-y-4">
        {metrics}
        {activity}
      </aside>
    </div>
  );
}
```

**important:** parallel routes need a `default.tsx` file as fallback when the slot doesn't match the current URL during soft navigation.

## intercepting routes — `(.)/`, `(..)/`, `(..)(..)/`, `(...)/`

Show a route in a different context (typically a modal) while preserving the URL. On hard refresh, the full page renders normally.

**when to use:**
- photo/item detail modals: click opens modal at `/photos/123`, refresh shows full page
- quick-edit overlays that preserve list context
- preview panels

```
src/app/(dashboard)/orders/
├── page.tsx                    # order list
├── [id]/page.tsx               # full order detail page (hard navigation / refresh)
└── (.)[id]/                    # intercepted route (shows as modal over the list)
    └── page.tsx                # modal version of order detail
```

**use only when** the UX genuinely benefits from staying on the current page. Don't overcomplicate navigation for the sake of using the feature.

## route handler conventions — `route.ts`

API endpoints. Named exports per HTTP method.

```
src/app/api/
├── auth/[...all]/route.ts    # better-auth mount (catch-all)
├── webhooks/
│   └── stripe/route.ts       # Stripe webhook handler
└── health/route.ts           # health check: GET /api/health
```

**rules:**
- one `route.ts` per logical endpoint
- export only the HTTP methods you support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- `route.ts` and `page.tsx` CANNOT coexist in the same directory
- use the standard response envelope for all Route Handlers

## special files — know them all

| file | purpose | falcani usage |
|------|---------|---------------|
| `page.tsx` | route UI | every route |
| `layout.tsx` | shared UI that persists across navigations | per route group |
| `loading.tsx` | streaming fallback (Suspense boundary) | falcani shimmer skeleton |
| `error.tsx` | error boundary UI | human error messages per section |
| `not-found.tsx` | 404 UI | custom, helpful, with navigation back |
| `default.tsx` | parallel route fallback | required for parallel routes |
| `route.ts` | API endpoint | webhooks, external APIs, health check |
| `template.tsx` | like layout but re-renders on navigation | rarely needed — use for animations between sibling routes |
| `global-error.tsx` | root-level error boundary | catches errors in root layout |

## loading.tsx — the falcani shimmer pattern

Every route group that needs a loading state gets a `loading.tsx` with the falcani shimmer skeleton. This is automatic Suspense wrapping.

```tsx
// src/app/(dashboard)/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-[#f2f2f2]" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-[#f2f2f2]" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-[#f2f2f2]" />
    </div>
  );
}
```

For component-level streaming within a page, use `<Suspense>` directly:

```tsx
import { Suspense } from "react";

export default function OrdersPage() {
  return (
    <div>
      <h1>Orders</h1>
      <Suspense fallback={<OrderTableSkeleton />}>
        <OrderTable />
      </Suspense>
    </div>
  );
}
```

## URL state with searchParams

Prefer URL searchParams over client state for any UI state that should be shareable or bookmarkable.

```tsx
// src/app/(dashboard)/orders/page.tsx
type Props = { searchParams: Promise<{ page?: string; status?: string; q?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const { page = "1", status, q } = await searchParams;

  const orders = await getOrders({
    page: parseInt(page),
    status,
    search: q,
  });

  return (
    <div>
      <OrderFilters currentStatus={status} currentSearch={q} />
      <OrderTable orders={orders.data} />
      <Pagination meta={orders.meta} />
    </div>
  );
}
```

**use searchParams for:** filters, sort order, pagination, active tab, search queries, selected items.
**use Valtio for:** theme toggle, sidebar open/closed, ephemeral UI state that shouldn't survive a page refresh.

## decision tree — which mechanism to use

```
Need different layouts for different sections?
  → route groups (auth)/ (dashboard)/

Need a URL segment that varies per resource?
  → dynamic segment [id]/

Need variable-depth paths (docs, CMS)?
  → catch-all [...slug]/ or optional [[...slug]]/

Need multiple independent panels in one layout?
  → parallel routes @metrics/ @activity/

Need a modal overlay that preserves URL and list context?
  → intercepting routes (.)[id]/

Need an API endpoint for external consumers?
  → route handler route.ts

Need a loading skeleton for a route?
  → loading.tsx (automatic Suspense boundary)

Need a loading skeleton within a page?
  → <Suspense fallback={<Skeleton />}>

Need error handling per section?
  → error.tsx (automatic error boundary)
```

## rendering strategy — choose per page

Every page should use the most efficient rendering strategy. Evaluate during Phase 1 architecture and during audits. Don't default to SSR for everything.

### decision tree

```
Is the content identical for every visitor and changes only at deploy time?
  → SSG (default export, no dynamic data fetching at request time)
  → generateStaticParams() for dynamic routes
  → loading.tsx is NOT needed — page is pre-built HTML on the CDN
  → examples: marketing pages, blog posts from MDX, about page, legal pages

Does the content change occasionally (hours/days) but is the same for all visitors?
  → ISR (revalidate option or "use cache" with cacheLife)
  → loading.tsx is useful — first visitor after revalidation waits for fresh data
  → examples: blog from CMS, product catalog, team directory from database

Does the content change per request or per user?
  → SSR (dynamic rendering) or streaming with Suspense
  → loading.tsx IS needed — every request fetches fresh data
  → examples: dashboards, user-specific pages, search results, personalized content

Is the page a mix — some parts static, some dynamic?
  → static shell with streamed dynamic sections
  → page renders instantly with static parts, Suspense streams dynamic parts
  → loading.tsx for the route + <Suspense> for individual dynamic sections
  → examples: product page (static description + live inventory), dashboard (static layout + live metrics)

Is the page entirely client-side with no server data needs?
  → client component with "use client" — no server rendering
  → loading.tsx is useful as an initial shell before JS hydrates
  → examples: interactive tools, calculators, canvas-based features
```

### what this means for loading.tsx

**loading.tsx only matters when the page fetches data at request time.** If a page is SSG (built at deploy), the HTML is already on the CDN and loading.tsx never renders. Don't create loading.tsx files for static pages — it adds files that serve no purpose.

When loading.tsx IS needed, always use the falcani shimmer skeleton pattern.

### auditing rendering strategies

When auditing an existing project, check each page:
- is this page SSR but the data doesn't change between users? → should be SSG or ISR
- is this page SSG but the data comes from an external source that changes? → should be ISR
- is this page fetching data client-side that could be a server component? → move the fetch to the server
- does this page have loading.tsx but the page is statically generated? → loading.tsx is unnecessary, remove it

## rules
- always use route groups to separate authenticated from public routes
- always create `loading.tsx` with falcani shimmer for route groups that fetch data **at request time** — not for static pages
- always validate dynamic params and call `notFound()` for missing resources
- always use `generateMetadata` for dynamic pages
- always evaluate rendering strategy per page: SSG → ISR → SSR → streaming (prefer the simplest that works)
- parallel routes always need `default.tsx` fallback files
- `route.ts` and `page.tsx` cannot coexist in the same folder
- prefer searchParams over client state for shareable UI state
- use intercepting routes only when the modal UX is genuinely better than navigation
- Next.js 16: params and searchParams are Promises — always `await` them
