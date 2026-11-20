export interface ProjectFile {
  path: string;
  content: string;
  language?: string;
}

export interface StudioProject {
  name: string;
  packageName: string;
  description: string;
  logoDataUrl?: string;
  logoFileName?: string;
  files: ProjectFile[];
}

export interface ValidationIssue {
  filePath: string;
  line?: number;
  message: string;
  severity: "error" | "warning";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
