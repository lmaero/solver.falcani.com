export type Ecosystem = "ts" | "cpp";

export interface InitOptions {
  ecosystem?: Ecosystem;
}

export interface ProjectState {
  hasClaudeMd: boolean;
  hasClaudeDir: boolean;
  hasOpenSpec: boolean;
  hasBiomeJson: boolean;
  hasPackageJson: boolean;
  projectRoot: string;
}

export interface FileOperation {
  path: string;
  action: "create" | "merge" | "skip" | "diff-and-ask";
  content: string;
  reason?: string;
}
