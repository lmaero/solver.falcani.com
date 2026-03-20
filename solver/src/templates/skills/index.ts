import { generateActionPatterns } from "./action-patterns.js";
import { generateCiCdPatterns } from "./ci-cd-patterns.js";
import { generateDataAccessPatterns } from "./data-access-patterns.js";
import { generateDiscovery } from "./discovery.js";
import { generateDomainPatterns } from "./domain-patterns.js";
import { generateEnvValidation } from "./env-validation.js";
import { generateLogging } from "./logging.js";
import { generateTestingStrategy } from "./testing-strategy.js";

export interface SkillGenerator {
  name: string;
  dirName: string;
  generate: () => string;
}

export function getAllSkillGenerators(): SkillGenerator[] {
  return [
    {
      dirName: "action-patterns",
      generate: generateActionPatterns,
      name: "action-patterns",
    },
    {
      dirName: "data-access-patterns",
      generate: generateDataAccessPatterns,
      name: "data-access-patterns",
    },
    {
      dirName: "env-validation",
      generate: generateEnvValidation,
      name: "env-validation",
    },
    {
      dirName: "logging",
      generate: generateLogging,
      name: "logging",
    },
    {
      dirName: "ci-cd-patterns",
      generate: generateCiCdPatterns,
      name: "ci-cd-patterns",
    },
    {
      dirName: "discovery",
      generate: generateDiscovery,
      name: "discovery",
    },
    {
      dirName: "domain-patterns",
      generate: generateDomainPatterns,
      name: "domain-patterns",
    },
    {
      dirName: "testing-strategy",
      generate: generateTestingStrategy,
      name: "testing-strategy",
    },
  ];
}
