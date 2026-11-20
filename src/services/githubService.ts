import { ProjectFile } from "../types/studio";

export interface PushToGitHubParams {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  commitMessage: string;
  files: ProjectFile[];
  pathPrefix?: string;
}

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getExistingFileSha(params: {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  token: string;
}): Promise<string | undefined> {
  const url = `[https://api.github.com/repos/$](https://api.github.com/repos/$){encodeURIComponent(
    params.owner
  )}/${encodeURIComponent(params.repo)}/contents/${params.path}?ref=${encodeURIComponent(
    params.branch
  )}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${params.token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (res.status === 404) return undefined;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub read failed (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return json?.sha;
}

export async function pushProjectFilesToGitHub(
  params: PushToGitHubParams,
  onProgress?: (current: number, total: number, filePath: string) => void
): Promise<{ pushedCount: number }> {
  const prefix = params.pathPrefix
    ? params.pathPrefix.replace(/^\/+|\/+$/g, "") + "/"
    : "";
  let pushedCount = 0;

  for (let i = 0; i < params.files.length; i++) {
    const file = params.files[i];
    const fullPath = `${prefix}${file.path.replace(/^\/+/, "")}`;
    onProgress?.(i + 1, params.files.length, fullPath);

    const sha = await getExistingFileSha({
      owner: params.owner,
      repo: params.repo,
      path: fullPath,
      branch: params.branch,
      token: params.token,
    });

    const url = `[https://api.github.com/repos/$](https://api.github.com/repos/$){encodeURIComponent(
      params.owner
    )}/${encodeURIComponent(params.repo)}/contents/${fullPath}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: params.commitMessage || `Update ${fullPath} via Droid AI Studio`,
        content: toBase64Utf8(file.content),
        branch: params.branch || "main",
        ...(sha ? { sha } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed pushing ${fullPath} (${res.status}): ${errText}`);
    }

    pushedCount++;
  }

  return { pushedCount };
}
