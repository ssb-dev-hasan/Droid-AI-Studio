import { AIProvider, ChatMessage, CodeError, ProjectMeta } from "../types/studio";

export interface RunAIStudioParams {
  provider: AIProvider;
  apiKey: string;
  projectMeta: ProjectMeta;
  files: Record<string, string>;
  errors: CodeError[];
  chatHistory: ChatMessage[];
  instruction: string;
  screenshotBase64?: string;
  screenshotMimeType?: string;
}

export async function runAIStudioTask({
  provider,
  apiKey,
  projectMeta,
  files,
  errors,
  chatHistory,
  instruction,
  screenshotBase64,
  screenshotMimeType = "image/png",
}: RunAIStudioParams): Promise<{
  reply: string;
  updatedFiles: Record<string, string>;
}> {
  if (!apiKey.trim()) {
    throw new Error("অনুগ্রহ করে আপনার নিজস্ব AI API Key দিন।");
  }

  const systemPrompt = `
You are the AI engine inside "Droid AI Studio".
The user may write instructions in Bengali (বাংলা), English, or ANY language supported by the model.
Always respect the user's projectMeta (projectName, packageName, logo).
When adding features or fixing errors (whether from text instructions, detected errors, or an uploaded screenshot), update ALL affected project files cleanly so everything stays consistent.
Never delete ".github/workflows/android.yml" unless explicitly requested.

Return ONLY valid JSON (no markdown fences) in this exact schema:
{
  "reply": "Clear short reply in the SAME language the user used",
  "files": {
    "path/to/File": "complete updated file content"
  }
}
`.trim();

  const payloadText = `${systemPrompt}

Project Meta:
${JSON.stringify({ projectName: projectMeta.projectName, packageName: projectMeta.packageName })}

Current Errors:
${JSON.stringify(errors)}

Recent Chat:
${JSON.stringify(chatHistory.slice(-6))}

User Instruction:
${instruction}

Current Project Files:
${JSON.stringify(files)}
`;

  const cleanBase64 = screenshotBase64
    ? screenshotBase64.includes(",")
      ? screenshotBase64.split(",")[1]
      : screenshotBase64
    : "";

  let rawText = "";

  if (provider === "gemini") {
    const parts: Array<Record<string, unknown>> = [];
    if (cleanBase64) {
      parts.push({
        inlineData: { mimeType: screenshotMimeType, data: cleanBase64 },
      });
    }
    parts.push({ text: payloadText });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Gemini API এরর এসেছে।");
    }
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } else if (provider === "openai") {
    const content: Array<Record<string, unknown>> = [{ type: "text", text: payloadText }];
    if (cleanBase64) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${screenshotMimeType};base64,${cleanBase64}` },
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "OpenAI API এরর এসেছে।");
    }
    rawText = data?.choices?.[0]?.message?.content ?? "";
  } else if (provider === "claude") {
    const content: Array<Record<string, unknown>> = [];
    if (cleanBase64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: screenshotMimeType,
          data: cleanBase64,
        },
      });
    }
    content.push({ type: "text", text: payloadText });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-7-sonnet-latest",
        max_tokens: 8192,
        messages: [{ role: "user", content }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Claude API এরর এসেছে।");
    }
    rawText = data?.content?.[0]?.text ?? "";
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as {
    reply?: string;
    files?: Record<string, string>;
  };

  return {
    reply: parsed.reply || "প্রজেক্টের ফাইলগুলো আপডেট করা হয়েছে।",
    updatedFiles: {
      ...files,
      ...(parsed.files ?? {}),
    },
  };
}
