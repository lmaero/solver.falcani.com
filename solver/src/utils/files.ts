import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface FileResult {
  action: "created" | "skipped" | "conflict" | "merged" | "overwritten";
  diff?: string;
}

export async function writeFileIfNotExists(
  filePath: string,
  content: string,
): Promise<FileResult> {
  try {
    const existing = await readFile(filePath, "utf-8");
    if (existing === content) {
      return { action: "skipped" };
    }
    return {
      action: "conflict",
      diff: `Existing file differs. Current: ${existing.length} chars, New: ${content.length} chars`,
    };
  } catch {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
    return { action: "created" };
  }
}

export async function overwriteFile(
  filePath: string,
  content: string,
): Promise<FileResult> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
  return { action: "overwritten" };
}

export async function mergeJsonFile(
  filePath: string,
  newData: Record<string, unknown>,
): Promise<FileResult> {
  try {
    const existing = JSON.parse(await readFile(filePath, "utf-8"));
    const merged = deepMerge(existing, newData);
    await writeFile(filePath, JSON.stringify(merged, null, 2));
    return { action: "merged" };
  } catch {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(newData, null, 2));
    return { action: "created" };
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object" &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
