import { describe, expect, it } from "vitest";
import {
  type SkillGenerator,
  getAllSkillGenerators,
} from "../../../src/templates/skills/index.js";

describe("skill generators", () => {
  const generators = getAllSkillGenerators();

  it("produces exactly 8 skills", () => {
    expect(generators).toHaveLength(8);
  });

  it("each generator has a unique name and dirName", () => {
    const names = generators.map((g) => g.name);
    const dirNames = generators.map((g) => g.dirName);
    expect(new Set(names).size).toBe(8);
    expect(new Set(dirNames).size).toBe(8);
  });

  it("each generator returns a string with YAML frontmatter containing name and description", () => {
    for (const gen of generators) {
      const content = gen.generate();
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(/\nname: .+\n/);
      expect(content).toMatch(/\ndescription: .+\n/);
      expect(content).toMatch(/\n---\n/);
    }
  });

  it("each skill is substantive (>500 chars)", () => {
    for (const gen of generators) {
      const content = gen.generate();
      expect(content.length).toBeGreaterThan(500);
    }
  });

  it("no skill contains library-specific mandates", () => {
    const forbiddenPatterns = [
      /MUST use shadcn/i,
      /MUST use Mongoose/i,
      /MUST use Prisma/i,
      /MUST use Drizzle/i,
      /MUST use react-hook-form/i,
      /MUST use Valibot/i,
      /MUST use Tailwind/i,
      /MUST use Framer Motion/i,
      /MUST use Valtio/i,
      /MUST use Zustand/i,
    ];

    for (const gen of generators) {
      const content = gen.generate();
      for (const pattern of forbiddenPatterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  });
});

describe("action-patterns skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "action-patterns",
  ) as SkillGenerator;
  const content = gen.generate();

  it("covers mutation return pattern concepts", () => {
    expect(content).toContain("success");
    expect(content).toContain("failure");
  });

  it("covers boundary validation", () => {
    expect(content).toContain("boundary");
    expect(content).toContain("validat");
  });

  it("covers human-facing error messages", () => {
    expect(content).toContain("We couldn't");
  });

  it("covers non-form mutations", () => {
    expect(content).toContain("delete");
  });

  it("does NOT reference framework-specific libraries", () => {
    expect(content).not.toContain("react-hook-form");
    expect(content).not.toContain("Zod");
    expect(content).not.toContain("Server Action");
    expect(content).not.toContain("shadcn");
  });
});

describe("data-access-patterns skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "data-access-patterns",
  ) as SkillGenerator;
  const content = gen.generate();

  it("covers service layer isolation", () => {
    expect(content).toContain("service");
  });

  it("covers validate before writes", () => {
    expect(content).toContain("validat");
    expect(content).toContain("write");
  });

  it("covers typed returns", () => {
    expect(content).toContain("typed");
  });

  it("covers logging in service functions", () => {
    expect(content).toContain("log");
  });

  it("covers pagination", () => {
    expect(content).toContain("pagination");
  });

  it("does NOT reference specific database libraries", () => {
    expect(content).not.toContain("MongoDB");
    expect(content).not.toContain("Mongoose");
    expect(content).not.toContain("Prisma");
    expect(content).not.toContain("Drizzle");
  });
});

describe("env-validation skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "env-validation",
  ) as SkillGenerator;
  const content = gen.generate();

  it("covers schema validation at startup", () => {
    expect(content).toContain("startup");
    expect(content).toContain("schema");
  });

  it("covers crash-on-invalid behavior", () => {
    expect(content).toContain("crash");
  });

  it("covers validated object access pattern", () => {
    expect(content).toContain("validated");
  });

  it("covers .env.example documentation", () => {
    expect(content).toContain(".env.example");
  });

  it("does NOT reference specific schema libraries", () => {
    expect(content).not.toContain("Zod");
    expect(content).not.toContain("Valibot");
  });
});

describe("logging skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "logging",
  ) as SkillGenerator;
  const content = gen.generate();

  it("mandates Pino as framework infrastructure", () => {
    expect(content).toContain("Pino");
  });

  it("covers log levels", () => {
    expect(content).toContain("fatal");
    expect(content).toContain("error");
    expect(content).toContain("warn");
    expect(content).toContain("info");
    expect(content).toContain("debug");
    expect(content).toContain("trace");
  });

  it("covers redaction", () => {
    expect(content).toContain("redact");
  });

  it("covers child loggers", () => {
    expect(content).toContain("child");
  });

  it("covers request correlation", () => {
    expect(content).toContain("correlation");
  });

  it("covers pretty dev and JSON production", () => {
    expect(content).toContain("pretty");
    expect(content).toContain("JSON");
  });
});

describe("ci-cd-patterns skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "ci-cd-patterns",
  ) as SkillGenerator;
  const content = gen.generate();

  it("covers quality gates", () => {
    expect(content).toContain("lint");
    expect(content).toContain("type check");
    expect(content).toContain("test");
    expect(content).toContain("build");
  });

  it("covers deploy from main", () => {
    expect(content).toContain("main");
    expect(content).toContain("deploy");
  });

  it("covers secrets management", () => {
    expect(content).toContain("secret");
  });

  it("covers database service containers", () => {
    expect(content).toContain("service container");
  });

  it("does NOT mandate a specific CI provider", () => {
    expect(content).not.toMatch(/MUST use GitHub Actions/i);
    expect(content).not.toMatch(/MUST use GitLab/i);
    expect(content).not.toMatch(/MUST use CircleCI/i);
  });
});

describe("discovery skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "discovery",
  ) as SkillGenerator;
  const content = gen.generate();

  it("covers product-driven questions", () => {
    expect(content).toContain("WHO");
    expect(content).toContain("WHAT");
    expect(content).toContain("WHY");
  });

  it("covers experience shape reasoning", () => {
    expect(content).toContain("dashboard");
    expect(content).toContain("workflow");
    expect(content).toContain("wizard");
  });

  it("covers constraint gathering", () => {
    expect(content).toContain("i18n");
    expect(content).toContain("auth");
    expect(content).toContain("offline");
  });

  it("covers OpenSpec integration", () => {
    expect(content).toContain("OpenSpec");
  });

  it("covers stack declaration in Phase 0", () => {
    expect(content).toContain("Phase 0");
    expect(content).toContain("stack");
  });
});

describe("domain-patterns skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "domain-patterns",
  ) as SkillGenerator;
  const content = gen.generate();

  it("covers domain separation", () => {
    expect(content).toContain("domain");
    expect(content).toContain("pure");
  });

  it("covers entity design", () => {
    expect(content).toContain("entity");
    expect(content).toContain("behavior");
  });

  it("covers state machines", () => {
    expect(content).toContain("state machine");
    expect(content).toContain("transition");
  });

  it("covers domain error hierarchy", () => {
    expect(content).toContain("error");
    expect(content).toContain("hierarchy");
  });

  it("covers pure functions with side effects at edges", () => {
    expect(content).toContain("side effect");
    expect(content).toContain("edge");
  });

  it("does NOT reference any specific language or framework", () => {
    expect(content).not.toContain("TypeScript");
    expect(content).not.toContain("JavaScript");
    expect(content).not.toContain("Next.js");
    expect(content).not.toContain("React");
    expect(content).not.toContain("Express");
  });
});

describe("testing-strategy skill", () => {
  const gen = getAllSkillGenerators().find(
    (g) => g.name === "testing-strategy",
  ) as SkillGenerator;
  const content = gen.generate();

  it("covers TDD mandatory scope", () => {
    expect(content).toContain("TDD");
    expect(content).toContain("business rule");
    expect(content).toContain("domain logic");
    expect(content).toContain("mutation");
    expect(content).toContain("permission");
  });

  it("covers tests-after scope", () => {
    expect(content).toContain("after implementation");
  });

  it("covers no-tests scope", () => {
    expect(content).toContain("config");
    expect(content).toContain("static content");
  });

  it("covers SRP as testing enabler", () => {
    expect(content).toContain("single responsibility");
    expect(content).toContain("pure function");
  });

  it("covers good test qualities", () => {
    expect(content).toContain("behavior");
    expect(content).toContain("mock");
    expect(content).toContain("boundar");
  });
});
