export function generateBiomeJson(): Record<string, unknown> {
  return {
    $schema: "https://biomejs.dev/schemas/2.0.0/schema.json",
    organizeImports: {
      enabled: true,
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
        suspicious: {
          noConsole: "error",
        },
      },
    },
    formatter: {
      enabled: true,
    },
  };
}

export function generateBiomeJsonString(): string {
  return JSON.stringify(generateBiomeJson(), null, 2);
}
