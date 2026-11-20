import { ChatMessage, ProjectFile, StudioProject } from "../types/studio";

export interface AIUpdateResult {
  reply: string;
  updatedFiles: ProjectFile[];
}

export async function generateCodeFromPrompt(params: {
  prompt: string;
  project: StudioProject;
  activeFile?: ProjectFile;
  history: ChatMessage[];
  apiKey?: string;
}): Promise<AIUpdateResult> {
  const { prompt, project, activeFile, apiKey } = params;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const fileSummary = project.files
        .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
        .join("\n\n");

      const instruction = `You are Droid AI Studio's code assistant for Android projects (${project.name}, package ${project.packageName}).
Return ONLY valid JSON:
{
  "reply": "Short explanation in Bengali",
  "updatedFiles": [
    { "path": "exact/file/path", "language": "kotlin", "content": "full updated file content" }
  ]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey.trim()
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${instruction}\n\nActive file: ${
                      activeFile?.path || "none"
                    }\nUser command: ${prompt}\n\nFiles:\n${fileSummary}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();
      const rawText: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.updatedFiles)) {
        return {
          reply: parsed.reply || "ফাইলগুলো আপডেট করা হয়েছে।",
          updatedFiles: parsed.updatedFiles,
        };
      }
    } catch (err) {
      return {
        reply: `API কল করতে সমস্যা হয়েছে (${String(err)})। লোকাল আপডেট প্রয়োগ করা হলো।`,
        updatedFiles: applyLocalFallback(prompt, project, activeFile),
      };
    }
  }

  return {
    reply:
      "Gemini API Key দেওয়া নেই, তাই বর্তমান ফাইলে কমান্ড অনুযায়ী কোড যুক্ত করা হয়েছে। স্মার্ট কোডিংয়ের জন্য API Key যুক্ত করুন।",
    updatedFiles: applyLocalFallback(prompt, project, activeFile),
  };
}

function applyLocalFallback(
  prompt: string,
  project: StudioProject,
  activeFile?: ProjectFile
): ProjectFile[] {
  const target = activeFile || project.files[0];
  if (!target) return [];

  const note = target.path.endsWith(".xml")
    ? `<!-- AI Command: ${prompt} -->\n`
    : `// AI Command: ${prompt}\n`;

  return [
    {
      ...target,
      content: `${note}${target.content}`,
    },
  ];
}
