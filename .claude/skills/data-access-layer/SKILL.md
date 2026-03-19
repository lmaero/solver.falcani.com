---
name: data-access-layer
description: "MongoDB data access layer patterns. Use when creating database services, collections, queries, indexes, or any MongoDB interaction."
---

# skill: data-access-layer

## purpose
Standardize all MongoDB database interactions through thin service wrappers per collection. No ORMs, no vendor lock-in, full control.

## pattern

Every MongoDB collection gets a service file in `lib/db/collections/[name].ts`. Each service:
- validates input with Zod before writes
- uses a Pino child logger for operation logging
- returns typed objects (never raw MongoDB documents to consumers)
- handles errors consistently
- defines its indexes explicitly

## template

```typescript
// lib/db/collections/users.ts
import { z } from "zod";
import { ObjectId, type Collection, type Db } from "mongodb";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "users" });

// Schema — single source of truth for validation
export const userSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
  organizationId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const userUpdateSchema = userSchema.partial().omit({ createdAt: true });

export type User = z.infer<typeof userSchema> & { _id: ObjectId };
export type CreateUserInput = z.infer<typeof userSchema>;
export type UpdateUserInput = z.infer<typeof userUpdateSchema>;

// Indexes — run once at startup via setup-indexes script
export const userIndexes = [
  { key: { email: 1 }, unique: true },
  { key: { organizationId: 1 } },
  { key: { role: 1, organizationId: 1 } },
];

export function createUsersService(db: Db) {
  const collection: Collection = db.collection("users");

  return {
    async findById(id: string): Promise<User | null> {
      log.debug({ id }, "findById");
      const doc = await collection.findOne({ _id: new ObjectId(id) });
      return doc as User | null;
    },

    async findByEmail(email: string): Promise<User | null> {
      log.debug({ email }, "findByEmail");
      const doc = await collection.findOne({ email });
      return doc as User | null;
    },

    async findByOrganization(
      organizationId: string,
      options?: { page?: number; limit?: number }
    ) {
      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;
      const skip = (page - 1) * limit;

      log.debug({ organizationId, page, limit }, "findByOrganization");

      const [docs, total] = await Promise.all([
        collection
          .find({ organizationId })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments({ organizationId }),
      ]);

      return {
        data: docs as User[],
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async create(input: CreateUserInput): Promise<User> {
      const validated = userSchema.parse(input);
      const now = new Date();
      const doc = { ...validated, createdAt: now, updatedAt: now };

      log.info({ email: validated.email }, "creating user");
      const result = await collection.insertOne(doc);

      return { ...doc, _id: result.insertedId } as User;
    },

    async update(id: string, input: UpdateUserInput): Promise<User | null> {
      const validated = userUpdateSchema.parse(input);

      log.info({ id, fields: Object.keys(validated) }, "updating user");
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...validated, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      return result as User | null;
    },

    async delete(id: string): Promise<boolean> {
      log.info({ id }, "deleting user");
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    },
  };
}
```

## db client setup

```typescript
// lib/db/client.ts
import { MongoClient } from "mongodb";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "mongodb" });

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  const g = globalThis as typeof globalThis & { _mongoClient?: MongoClient };
  if (!g._mongoClient) {
    g._mongoClient = new MongoClient(env.MONGODB_URI);
  }
  client = g._mongoClient;
} else {
  client = new MongoClient(env.MONGODB_URI);
}

export const db = client.db(env.DB_NAME);

// Service instances
import { createUsersService } from "./collections/users";
export const users = createUsersService(db);

log.info("database services initialized");
```

## index setup script

```typescript
// scripts/setup-indexes.ts
import { db } from "@/lib/db/client";
import { userIndexes } from "@/lib/db/collections/users";
// import other indexes...

async function setupIndexes() {
  console.log("setting up indexes...");

  await db.collection("users").createIndexes(userIndexes);
  // await db.collection("orders").createIndexes(orderIndexes);

  console.log("indexes created successfully");
  process.exit(0);
}

setupIndexes().catch((err) => {
  console.error("index setup failed:", err);
  process.exit(1);
});
```

## rules
- one file per collection, always in `lib/db/collections/`
- Zod schema defined in the same file as the service
- every write operation validates with Zod BEFORE touching the database
- every service uses a pino child logger with `{ service: "[collection-name]" }`
- indexes are defined as exports, applied via setup script — never assumed
- use MongoDB transactions when multiple writes must be atomic
- pagination returns `{ data, meta: { page, limit, total, totalPages } }`
- never return raw MongoDB documents to API consumers — type them
