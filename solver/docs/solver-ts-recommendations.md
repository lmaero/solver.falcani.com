# solver — TypeScript library recommendations

These are battle-tested libraries the falcani team recommends for TypeScript projects. They are **recommendations, not mandates** — choose what fits your project's needs. Each concern lists alternatives worth evaluating.

| Concern | Recommended | Alternatives |
|---|---|---|
| Schema validation | Zod | Valibot, ArkType, io-ts |
| Forms | react-hook-form | Mantine forms, Formik, native |
| State management | Valtio | Zustand, Jotai, none |
| Data fetching | TanStack Query | SWR, native fetch |
| UI components | shadcn/ui | Mantine, Ant Design, Radix, none |
| CSS | Tailwind CSS | CSS modules, vanilla, Panda CSS |
| Animation | GSAP | CSS transitions, View Transitions API |
| Auth | better-auth | Auth.js, Clerk, Supabase Auth |
| Database | MongoDB native driver | Mongoose, Prisma, Drizzle |

## How to use this

During Phase 0 discovery, review these recommendations against your project's constraints. Pick what serves the project — not what's familiar. Document your choices in the project's stack declaration.
