---
name: action-patterns
description: Mutation return types, boundary validation, and human-facing error patterns
---

# Action Patterns

Every mutation in the system — whether triggered by a form submission, a delete button, a toggle, or a status change — follows the same return pattern and validation discipline.

## Mutation Return Pattern

Mutations return a typed result that distinguishes success from failure using a discriminated union. The caller always knows which path it's on without guessing.

The result type has two shapes:

**Success shape:**
- A discriminator field indicating success (e.g., `success: true`)
- The resulting data, if any

**Failure shape:**
- A discriminator field indicating failure (e.g., `success: false`)
- A human-facing error message
- Optional field-level errors for form inputs

### Why a discriminated union?

Raw return values create ambiguity. Did `null` mean "not found" or "something crashed"? Did an empty array mean "no results" or "query failed"? The typed result removes all ambiguity. Callers destructure the result and handle both paths explicitly.

### Pseudocode

```
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

Every mutation function returns `ActionResult<T>`. Helper functions like `actionSuccess(data)` and `actionError(message, fieldErrors?)` keep construction consistent.

## Boundary Validation

Every entry point validates inputs against a schema BEFORE executing business logic. This is non-negotiable. The validation boundary is the first line of defense — if input is malformed, the mutation returns a failure result immediately. Business logic never sees invalid data.

### The pattern

1. Parse input against the schema
2. If validation fails, return failure result with field errors
3. If validation passes, proceed to business logic
4. Return success or failure result based on business outcome

### Why at the boundary?

Validating deep inside business logic means invalid data has already traveled through layers of code. Bugs multiply. Boundary validation keeps the contamination radius to zero.

## Error Messages — Human-First

Error messages follow the pattern: "We couldn't [action] because [reason]. Try [fix]."

Examples:
- "We couldn't save your profile because the email is already in use. Try a different email address."
- "We couldn't delete this project because it has active members. Try removing all members first."
- "We couldn't update the status because the item has been archived. Try restoring it first."

Never expose raw database errors, stack traces, or generic messages like "Something went wrong" to users. Log the technical details server-side; show the human what happened and what to do about it.

## Field Errors

For form-style mutations, the failure result can include field-level errors. These map field names to arrays of error messages, enabling the UI to highlight specific inputs.

```
{
  success: false,
  error: "We couldn't create the account because some fields are invalid. Fix the highlighted fields and try again.",
  fieldErrors: {
    email: ["Must be a valid email address"],
    password: ["Must be at least 8 characters"]
  }
}
```

## Non-Form Mutations

Delete buttons, toggle switches, status transitions, and bulk operations use the exact same pattern. They validate input (even if it's just an ID), execute the operation, and return `ActionResult<T>`.

```
// Delete operation — same pattern
function deleteProject(id: string): ActionResult<void> {
  // 1. Validate: is the ID well-formed?
  // 2. Check preconditions: can this be deleted?
  // 3. Execute: perform the deletion
  // 4. Return: success or failure with human message
}
```

## Composing Mutations

When a mutation calls another service, it checks the inner result before proceeding. Early returns on failure keep the code flat and readable.

```
function transferOwnership(projectId, newOwnerId): ActionResult<void> {
  const project = findProject(projectId)
  if (!project) return actionError("We couldn't transfer ownership because the project was not found.")

  const newOwner = findUser(newOwnerId)
  if (!newOwner) return actionError("We couldn't transfer ownership because the new owner account was not found.")

  // Proceed with transfer...
  return actionSuccess(undefined)
}
```

## Checklist

- [ ] Every mutation returns `ActionResult<T>`
- [ ] Input is validated at the boundary before any business logic
- [ ] Error messages follow "We couldn't [action] because [reason]. Try [fix]."
- [ ] Field errors are included for form mutations
- [ ] Non-form mutations (delete, toggle, status change) use the same pattern
- [ ] Technical errors are logged server-side, never exposed to users
