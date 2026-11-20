export type AIProvider = "gemini" | "openai" | "claude";

export interface ProjectMeta {
  projectName: string;
  packageName: string;
  logoBase64: string;
  logoMimeType: string;
}

export interface CodeError {
  id: string;
  filePath: string;
  line: number;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
}

export interface StudioUserConfig {
  userId: string;
  aiProvider: AIProvider;
  apiKey: string;
  repoUrl: string;
  githubToken: string;
  branch: string;
}
