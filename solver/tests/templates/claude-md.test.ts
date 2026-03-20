import { describe, expect, it } from "vitest";
import { generateClaudeMd } from "../../src/templates/claude-md.js";

describe("generateClaudeMd", () => {
  const content = generateClaudeMd();

  it("contains solver identity", () => {
    expect(content).toContain("solver");
    expect(content).toContain("falcani");
  });

  it("contains product-driven thinking directive", () => {
    expect(content).toContain("WHY it exists");
    expect(content).toContain("what problem it solves");
  });

  it("contains spec-driven development with OpenSpec", () => {
    expect(content).toContain("OpenSpec");
    expect(content).toContain("source of truth");
    expect(content).toContain("spec delta");
  });

  it("contains two-strike rule with strike definition", () => {
    expect(content).toContain("2 attempts");
    expect(content).toContain("substantive approach change");
  });

  it("contains TDD scope for business logic", () => {
    expect(content).toContain("TDD");
    expect(content).toContain("business rule");
    expect(content).toContain("mutation");
    expect(content).toContain("permission");
  });

  it("contains decision authority model", () => {
    expect(content).toContain("human approval");
    expect(content).toContain("autonomous");
  });

  it("contains three engineering signatures", () => {
    expect(content).toContain("error boundaries");
    expect(content).toContain("falcanized");
    expect(content).toContain("We couldn't");
  });

  it("contains framework-mandated infrastructure categories", () => {
    expect(content).toContain("linting");
    expect(content).toContain("structured logging");
    expect(content).toContain("test runner");
  });

  it("contains mutation return pattern", () => {
    expect(content).toContain("typed result");
    expect(content).toContain("success");
    expect(content).toContain("failure");
  });

  it("contains project stack declaration", () => {
    expect(content).toContain("Phase 0");
    expect(content).toContain("project declares");
  });

  it("contains code philosophy", () => {
    expect(content).toContain("single responsibility");
    expect(content).toContain("comments explain WHY");
  });

  it("contains scope classifier with OpenSpec fast-path", () => {
    expect(content).toContain("scope classifier");
    expect(content).toContain("Trivial");
    expect(content).toContain("Standard");
    expect(content).toContain("Architectural");
    expect(content).toContain("OpenSpec");
  });

  it("contains conventional commits", () => {
    expect(content).toContain("feat:");
    expect(content).toContain("fix:");
  });

  it("contains challenge assumptions directive", () => {
    expect(content).toContain("Challenge");
    expect(content).toContain("assumption");
  });

  it("contains apply standards contextually", () => {
    expect(content).toContain("contextually");
  });

  it("does NOT contain library-specific mandates", () => {
    expect(content).not.toContain("shadcn");
    expect(content).not.toContain("Tailwind");
    expect(content).not.toContain("react-hook-form");
    expect(content).not.toContain("MongoDB");
    expect(content).not.toContain("better-auth");
    expect(content).not.toContain("Valtio");
    expect(content).not.toContain("GSAP");
    expect(content).not.toContain("Framer Motion");
  });

  it("does NOT contain removed sections", () => {
    expect(content).not.toContain("animation tiers");
    expect(content).not.toContain("shimmer skeleton");
    expect(content).not.toContain("View Transitions");
  });
});
