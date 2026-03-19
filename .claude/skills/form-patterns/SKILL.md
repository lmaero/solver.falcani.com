---
name: form-patterns
description: "Forms, Server Actions, ActionResult type, Zod validation, react-hook-form, DevFormFiller. Use when building forms, creating Server Actions, handling form submission, or implementing ActionResult patterns."
---

# skill: form-patterns

## purpose
Standardize form handling with react-hook-form, Zod validation, Server Actions with a consistent result type, and dev-mode form prefiller for rapid testing.

## the pattern: one Zod schema, four uses

1. Zod schema defines the shape (single source of truth)
2. react-hook-form uses the schema for client-side validation
3. Server Action uses the same schema for server-side validation
4. Server Action returns a typed ActionResult — same shape, every time, every project

Zero drift between client and server validation. Zero ambiguity in how the frontend handles results.

## ActionResult type — the falcani standard for ALL Server Action returns

```typescript
// lib/actions/types.ts

type ActionSuccess<T> = {
  data: T;
  error?: never;
};

type ActionError = {
  data?: never;
  error: {
    code: string;                              // machine-readable: "VALIDATION_ERROR", "NOT_FOUND", etc.
    message: string;                           // human-readable: "Email is already in use"
    fieldErrors?: Record<string, string[]>;    // per-field errors for form mapping
  };
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// Helpers — always use these, never construct objects manually
export function actionSuccess<T>(data: T): ActionResult<T> {
  return { data };
}

export function actionError(
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return { error: { code, message, fieldErrors } };
}

// Standard error codes — use these, don't invent new ones unless necessary
export const ActionErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",           // e.g., duplicate email
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
```

Every Server Action in every falcani project returns `ActionResult<T>`. No exceptions. The `never` types enable TypeScript narrowing — `if (result.error)` guarantees `data` doesn't exist, and vice versa.

## template — full flow from schema to form

### 1. schema (single source of truth)

```typescript
// schemas/order.ts
import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(200),
  email: z.string().email("Invalid email address"),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive("Quantity must be positive"),
  })).min(1, "At least one item is required"),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
```

### 2. server action (returns ActionResult)

```typescript
// actions/orders.ts
"use server";

import { createOrderSchema, type CreateOrderInput } from "@/schemas/order";
import { type ActionResult, actionSuccess, actionError, ActionErrorCode } from "@/lib/actions/types";
import { orders } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import type { Order } from "@/lib/db/collections/orders";

const log = logger.child({ action: "createOrder" });

export async function createOrder(input: CreateOrderInput): Promise<ActionResult<Order>> {
  // Server-side validation with the SAME Zod schema
  const parsed = createOrderSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    log.warn({ fieldErrors }, "validation failed");
    return actionError(
      ActionErrorCode.VALIDATION_ERROR,
      "Please fix the errors below.",
      fieldErrors
    );
  }

  try {
    // Check for conflicts before writing
    const existing = await orders.findByEmail(parsed.data.email);
    if (existing) {
      return actionError(
        ActionErrorCode.CONFLICT,
        "An order with this email already exists.",
        { email: ["This email is already associated with an order"] }
      );
    }

    const order = await orders.create(parsed.data);
    log.info({ orderId: order._id }, "order created");
    return actionSuccess(order);
  } catch (err) {
    log.error({ err }, "failed to create order");
    return actionError(
      ActionErrorCode.INTERNAL_ERROR,
      "Something went wrong creating your order. Please try again."
    );
  }
}
```

### 3. useActionHandler hook (bridges ActionResult to react-hook-form)

```typescript
// hooks/use-action-handler.ts
"use client";

import { useState, useCallback } from "react";
import { type UseFormReturn, type FieldValues } from "react-hook-form";
import { type ActionResult } from "@/lib/actions/types";

export function useActionHandler<TForm extends FieldValues>(form: UseFormReturn<TForm>) {
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async <TData>(action: () => Promise<ActionResult<TData>>): Promise<ActionResult<TData> | null> => {
      setIsPending(true);
      form.clearErrors();

      try {
        const result = await action();

        if (result.error) {
          // Map field-level errors to react-hook-form
          if (result.error.fieldErrors) {
            for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
              if (messages && messages.length > 0) {
                form.setError(field as any, { message: messages[0] });
              }
            }
          }

          // Set root error for non-field messages (toast-worthy)
          form.setError("root", { message: result.error.message });
          return result;
        }

        return result;
      } catch {
        form.setError("root", { message: "An unexpected error occurred. Please try again." });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [form]
  );

  return { execute, isPending };
}
```

### 4. client form (consumes ActionResult via useActionHandler)

```tsx
// components/orders/create-order-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createOrderSchema, type CreateOrderInput } from "@/schemas/order";
import { createOrder } from "@/actions/orders";
import { useActionHandler } from "@/hooks/use-action-handler";
import { DevFormFiller } from "@/components/dev/dev-form-filler";
import { orderFormScenarios } from "./create-order-scenarios";

export function CreateOrderForm() {
  const router = useRouter();
  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { customerName: "", email: "", items: [], notes: "" },
  });

  const { execute, isPending } = useActionHandler(form);

  async function onSubmit(data: CreateOrderInput) {
    const result = await execute(() => createOrder(data));

    if (result?.data) {
      router.push(`/orders/${result.data._id}`);
    }
  }

  return (
    <>
      <DevFormFiller form={form} scenarios={orderFormScenarios} />
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Global error (non-field) */}
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}

        {/* Form fields using form.register() */}

        <button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create order"}
        </button>
      </form>
    </>
  );
}
```

## how it all connects

```
┌──────────────────────────────────────────────────────────────────┐
│  schemas/order.ts                                                │
│  createOrderSchema (Zod)  <── SINGLE SOURCE OF TRUTH             │
│  CreateOrderInput (type)                                         │
└────────┬──────────────────────────────┬──────────────────────────┘
         │                              │
         v                              v
┌─────────────────────┐    ┌───────────────────────────────────────┐
│  Client form         │    │  Server Action                        │
│  react-hook-form     │    │  actions/orders.ts                    │
│  zodResolver()       │    │  createOrderSchema.safeParse()        │
│  client validation   │    │  server validation (same schema)      │
│                      │    │  returns ActionResult<Order>          │
└────────┬─────────────┘    └──────────────────┬────────────────────┘
         │                                     │
         │         ┌───────────────────────┐   │
         └────────>│  useActionHandler      │<──┘
                   │  maps ActionResult     │
                   │  -> form.setError()    │
                   │  -> form.root error    │
                   │  -> isPending state    │
                   └───────────────────────┘
```

## for server actions WITHOUT forms (non-form mutations)

Not every Server Action is triggered by a form. Delete buttons, toggle switches, quick actions. These still return ActionResult but don't need react-hook-form or useActionHandler.

```typescript
// actions/orders.ts
"use server";

import { type ActionResult, actionSuccess, actionError, ActionErrorCode } from "@/lib/actions/types";
import { orders } from "@/lib/db/client";
import { logger } from "@/lib/logger";

const log = logger.child({ action: "deleteOrder" });

export async function deleteOrder(orderId: string): Promise<ActionResult<{ deleted: true }>> {
  if (!orderId) {
    return actionError(ActionErrorCode.VALIDATION_ERROR, "Order ID is required.");
  }

  try {
    const success = await orders.delete(orderId);

    if (!success) {
      return actionError(ActionErrorCode.NOT_FOUND, "Order not found.");
    }

    log.info({ orderId }, "order deleted");
    return actionSuccess({ deleted: true });
  } catch (err) {
    log.error({ err, orderId }, "failed to delete order");
    return actionError(ActionErrorCode.INTERNAL_ERROR, "Could not delete the order. Please try again.");
  }
}
```

```tsx
// Client usage without form
"use client";

import { deleteOrder } from "@/actions/orders";

function DeleteButton({ orderId }: { orderId: string }) {
  async function handleDelete() {
    const result = await deleteOrder(orderId);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    // result.data is typed as { deleted: true }
    toast.success("Order deleted.");
    router.refresh();
  }

  return <button onClick={handleDelete}>Delete</button>;
}
```

## DevFormFiller component

Dev-only floating toolbar for rapid form testing. Stripped from production builds.

```tsx
// components/dev/dev-form-filler.tsx
"use client";

import { type UseFormReturn } from "react-hook-form";

export type FormScenario<T> = {
  label: string;
  description: string;
  type: "valid" | "invalid" | "empty" | "edge" | "realistic";
  data: Partial<T>;
};

type DevFormFillerProps<T extends Record<string, unknown>> = {
  form: UseFormReturn<T>;
  scenarios: FormScenario<T>[];
};

export function DevFormFiller<T extends Record<string, unknown>>({
  form,
  scenarios,
}: DevFormFillerProps<T>) {
  if (process.env.NODE_ENV === "production") return null;

  const typeColors: Record<string, string> = {
    valid: "bg-green-100 text-green-800",
    invalid: "bg-red-100 text-red-800",
    empty: "bg-gray-100 text-gray-800",
    edge: "bg-yellow-100 text-yellow-800",
    realistic: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border bg-white p-3 shadow-lg max-w-xs">
      <p className="text-xs font-medium text-gray-500 mb-2">Dev Form Filler</p>
      <div className="flex flex-wrap gap-1">
        {scenarios.map((scenario) => (
          <button
            key={scenario.label}
            type="button"
            title={scenario.description}
            onClick={() => form.reset(scenario.data as T)}
            className={`text-xs px-2 py-1 rounded ${typeColors[scenario.type] ?? "bg-gray-100"}`}
          >
            {scenario.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => form.reset()}
          className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
```

## scenario definition template

```typescript
// components/orders/create-order-scenarios.ts
import { type FormScenario } from "@/components/dev/dev-form-filler";
import { type CreateOrderInput } from "@/schemas/order";

export const orderFormScenarios: FormScenario<CreateOrderInput>[] = [
  {
    label: "Valid",
    description: "Complete valid order",
    type: "valid",
    data: {
      customerName: "Maria Garcia Lopez",
      email: "maria.garcia@empresa.co",
      items: [{ productId: "prod_001", quantity: 3 }],
      notes: "Deliver before 5pm",
    },
  },
  {
    label: "Invalid email",
    description: "Valid data except malformed email",
    type: "invalid",
    data: {
      customerName: "Test User",
      email: "not-an-email",
      items: [{ productId: "prod_001", quantity: 1 }],
    },
  },
  {
    label: "Empty",
    description: "All fields blank — test required validation",
    type: "empty",
    data: {},
  },
  {
    label: "Edge: long name",
    description: "200-char name, special characters, unicode",
    type: "edge",
    data: {
      customerName: "N".repeat(200),
      email: "edge.case+special@subdomain.empresa.co",
      items: [{ productId: "prod_001", quantity: 999999 }],
      notes: "Notes with special chars <>&\"'",
    },
  },
  {
    label: "Realistic",
    description: "Production-like data for demos and screenshots",
    type: "realistic",
    data: {
      customerName: "Alejandro Rodriguez",
      email: "alejandro.rodriguez@logistica-express.com",
      items: [
        { productId: "prod_042", quantity: 12 },
        { productId: "prod_017", quantity: 5 },
      ],
      notes: "Fragile items, handle with care. Contact warehouse before 8am.",
    },
  },
];
```

## rules
- EVERY Server Action returns `ActionResult<T>` — no exceptions, no custom shapes
- `lib/actions/types.ts` is created during scaffolding (Phase 2) — it exists in every project
- use `actionSuccess()` and `actionError()` helpers — never construct the objects manually
- use `ActionErrorCode` constants — don't invent error code strings inline
- validation errors MUST include `fieldErrors` so forms can map them to fields
- non-field errors go in `error.message` and render via `form.formState.errors.root` or toast
- `useActionHandler` is the standard bridge between ActionResult and react-hook-form
- every form has a Zod schema in `schemas/[domain].ts`
- the Server Action re-validates with the SAME Zod schema
- DevFormFiller scenarios are defined alongside the form component
- every form must have at minimum: valid, invalid, empty, and realistic scenarios
- scenarios use realistic data appropriate to the client's domain (not "John Doe")
- DevFormFiller is NEVER rendered in production (process.env.NODE_ENV check)
