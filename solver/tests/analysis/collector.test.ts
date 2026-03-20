import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectProjectData } from "../../src/analysis/collector.js";

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

  it("detects package.json dependencies", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^19.0.0", next: "^16.0.0" },
        devDependencies: { vitest: "^4.0.0" },
      }),
    );
    const data = await collectProjectData(tempDir);
    expect(data.dependencies).toContain("react");
    expect(data.dependencies).toContain("next");
    expect(data.devDependencies).toContain("vitest");
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

  it("captures directory structure", async () => {
    await mkdir(join(tempDir, "src", "components"), { recursive: true });
    await mkdir(join(tempDir, "tests"), { recursive: true });
    await mkdir(join(tempDir, "docs"), { recursive: true });
    const data = await collectProjectData(tempDir);
    expect(data.directoryStructure).toContain("src");
    expect(data.directoryStructure).toContain("tests");
    expect(data.directoryStructure).toContain("docs");
    expect(data.directoryStructure).toContain("src/components");
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
});
