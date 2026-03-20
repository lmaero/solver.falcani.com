#!/bin/bash
# falcani solver — session-end hook
# Runs type checking before session ends

echo "Running type check..."
pnpm tsc --noEmit
