import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectProjectData, detectMissingDependencies } from "../../src/analysis/collector.js";

describe("collectProjectData", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-collector-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("counts source files by extension", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "index.ts"), "const x = 1;");
    await writeFile(join(tempDir, "src", "app.tsx"), "export default () => null;");
    await writeFile(join(tempDir, "src", "style.css"), "body {}");
    const data = await collectProjectData(tempDir);
    expect(data.fileCounts.ts).toBe(1);
    expect(data.fileCounts.tsx).toBe(1);
    expect(data.fileCounts.css).toBe(1);
  });

  it("detects package.json dependencies with versions", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^19.0.0", next: "^16.0.0" },
        devDependencies: { vitest: "^4.0.0" },
      }),
    );
    const data = await collectProjectData(tempDir);
    const depNames = data.dependencies.map((d) => d.name);
    expect(depNames).toContain("react");
    expect(depNames).toContain("next");
    const reactDep = data.dependencies.find((d) => d.name === "react");
    expect(reactDep?.version).toBe("^19.0.0");
    const devDepNames = data.devDependencies.map((d) => d.name);
    expect(devDepNames).toContain("vitest");
    const vitestDep = data.devDependencies.find((d) => d.name === "vitest");
    expect(vitestDep?.version).toBe("^4.0.0");
  });

  it("detects project framework from dependencies", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { next: "^16.0.0" },
      }),
    );
    const data = await collectProjectData(tempDir);
    expect(data.detectedFramework).toBe("next");
  });

  it("returns empty dependency arrays for empty project", async () => {
    const data = await collectProjectData(tempDir);
    expect(data.dependencies).toHaveLength(0);
    expect(data.devDependencies).toHaveLength(0);
  });

  it("counts test files", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    await writeFile(join(tempDir, "tests", "app.test.ts"), "test('x', () => {});");
    await writeFile(join(tempDir, "src", "util.spec.ts"), "test('y', () => {});");
    const data = await collectProjectData(tempDir);
    expect(data.testFileCount).toBe(2);
    expect(data.sourceFileCount).toBeGreaterThanOrEqual(1);
  });

  it("lists files over 400 lines", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    const longContent = Array(450).fill("const x = 1;").join("\n");
    await writeFile(join(tempDir, "src", "big.ts"), longContent);
    await writeFile(join(tempDir, "src", "small.ts"), "const x = 1;");
    const data = await collectProjectData(tempDir);
    expect(data.largeFiles.length).toBe(1);
    expect(data.largeFiles[0].path).toContain("big.ts");
  });

  it("returns empty data for empty project", async () => {
    const data = await collectProjectData(tempDir);
    expect(data.sourceFileCount).toBe(0);
    expect(data.testFileCount).toBe(0);
    expect(data.dependencies).toHaveLength(0);
  });

  it("excludes node_modules from file counts", async () => {
    await mkdir(join(tempDir, "node_modules", "pkg"), { recursive: true });
    await writeFile(join(tempDir, "node_modules", "pkg", "index.ts"), "const x = 1;");
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "app.ts"), "const x = 1;");
    const data = await collectProjectData(tempDir);
    expect(data.sourceFileCount).toBe(1);
    expect(data.fileCounts.ts).toBe(1);
  });

  it("detects CI config", async () => {
    await mkdir(join(tempDir, ".github", "workflows"), { recursive: true });
    await writeFile(join(tempDir, ".github", "workflows", "ci.yml"), "name: CI");
    const data = await collectProjectData(tempDir);
    expect(data.hasCiConfig).toBe(true);
  });

  it("detects Dockerfile", async () => {
    await writeFile(join(tempDir, "Dockerfile"), "FROM node:22");
    const data = await collectProjectData(tempDir);
    expect(data.hasDockerfile).toBe(true);
  });

  it("detects OpenSpec directory", async () => {
    await mkdir(join(tempDir, "openspec"), { recursive: true });
    const data = await collectProjectData(tempDir);
    expect(data.hasOpenSpec).toBe(true);
  });

  it("captures directory structure as tree format", async () => {
    await mkdir(join(tempDir, "src", "components"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await mkdir(join(tempDir, "docs"), { recursive: true });
    const data = await collectProjectData(tempDir);
    expect(data.directoryStructure).toContain("src/");
    expect(data.directoryStructure).toContain("tests/");
    expect(data.directoryStructure).toContain("docs/");
    expect(data.directoryStructure).toContain("components/");
    // Verify tree formatting characters
    expect(data.directoryStructure).toMatch(/[├└]──/);
  });

  it("detects test files in __tests__ directory", async () => {
    await mkdir(join(tempDir, "src", "__tests__"), { recursive: true });
    await writeFile(join(tempDir, "src", "__tests__", "helper.ts"), "test('z', () => {});");
    const data = await collectProjectData(tempDir);
    expect(data.testFileCount).toBe(1);
  });

  it("calculates test coverage ratio", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await writeFile(join(tempDir, "src", "a.ts"), "export const a = 1;");
    await writeFile(join(tempDir, "src", "b.ts"), "export const b = 2;");
    await writeFile(join(tempDir, "tests", "a.test.ts"), "test('a', () => {});");
    const data = await collectProjectData(tempDir);
    expect(data.testCoverageRatio).toBeCloseTo(0.5);
  });

  it("includes missingDependencies in project data", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import React from "react";\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const data = await collectProjectData(tempDir);
    expect(data.missingDependencies).toContain("react");
  });
});

describe("detectMissingDependencies", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "solver-deps-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("detects missing package imported in source but not in package.json", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import React from "react";\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toContain("react");
  });

  it("ignores Node.js builtin modules", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import { join } from "node:path";\nimport fs from "fs";\nimport { createHash } from "crypto";\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toHaveLength(0);
  });

  it("ignores relative imports", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import { helper } from "./utils";\nimport { other } from "../lib/other";\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toHaveLength(0);
  });

  it("returns empty array when all imports are satisfied", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import React from "react";\nimport { z } from "zod";\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^19.0.0" },
        devDependencies: { zod: "^3.0.0" },
      }),
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toHaveLength(0);
  });

  it("handles scoped packages correctly", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import { Button } from "@react-email/components";\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toContain("@react-email/components");
  });

  it("handles require() syntax", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.js"),
      'const express = require("express");\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toContain("express");
  });

  it("returns empty array when no package.json exists", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import React from "react";\n',
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toHaveLength(0);
  });

  it("ignores TypeScript path aliases", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "app.ts"),
      'import { db } from "@/lib/db";\nimport { auth } from "~/auth";\nimport { config } from "#config";\n',
    );
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    const missing = await detectMissingDependencies(tempDir);
    expect(missing).toHaveLength(0);
  });
});
