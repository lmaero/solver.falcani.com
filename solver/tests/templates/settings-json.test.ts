import { describe, expect, it } from "vitest";
import { generateSettingsJson } from "../../src/templates/settings-json.js";

describe("generateSettingsJson", () => {
  it("allows common dev commands", () => {
    const settings = generateSettingsJson();
    const parsed = JSON.parse(settings);
    const allowed = JSON.stringify(parsed);
    expect(allowed).toContain("git");
    expect(allowed).toContain("pnpm");
  });

  it("blocks dangerous commands", () => {
    const settings = generateSettingsJson();
    const parsed = JSON.parse(settings);
    const denied = JSON.stringify(parsed.permissions?.deny || []);
    expect(denied).toContain("sudo");
  });
});
