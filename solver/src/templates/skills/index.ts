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
      name: "action-patterns",
      dirName: "action-patterns",
      generate: generateActionPatterns,
    },
    {
      name: "data-access-patterns",
      dirName: "data-access-patterns",
      generate: generateDataAccessPatterns,
    },
    {
      name: "env-validation",
      dirName: "env-validation",
      generate: generateEnvValidation,
    },
    {
      name: "logging",
      dirName: "logging",
      generate: generateLogging,
    },
    {
      name: "ci-cd-patterns",
      dirName: "ci-cd-patterns",
      generate: generateCiCdPatterns,
    },
    {
      name: "discovery",
      dirName: "discovery",
      generate: generateDiscovery,
    },
    {
      name: "domain-patterns",
      dirName: "domain-patterns",
      generate: generateDomainPatterns,
    },
    {
      name: "testing-strategy",
      dirName: "testing-strategy",
      generate: generateTestingStrategy,
    },
  ];
}
