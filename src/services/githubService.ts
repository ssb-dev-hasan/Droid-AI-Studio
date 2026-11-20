export function parseGitHubRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const cleaned = repoUrl
    .trim()
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");

  const match = cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)$/i);
  if (!match) {
    throw new Error("সঠিক GitHub রিপোজিটরি URL দিন (যেমন: https://github.com/username/Droid-AI-Studio)");
  }
  return { owner: match[1], repo: match[2] };
}

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

export async function pushAllFilesToGitHub(params: {
  repoUrl: string;
  token: string;
  branch: string;
  files: Record<string, string>;
  commitMessage: string;
}): Promise<{ pushedCount: number }> {
  const { owner, repo } = parseGitHubRepoUrl(params.repoUrl);
  const headers = {
    Authorization: `Bearer ${params.token.trim()}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  // বর্তমান ব্রাঞ্চের সর্বশেষ commit ও tree SHA আনা
  const refRes = await fetch(`${apiBase}/git/ref/heads/${encodeURIComponent(params.branch)}`, {
    headers,
  });

  if (!refRes.ok) {
    throw new Error(
      `ব্রাঞ্চ "${params.branch}" পাওয়া যায়নি বা Token-এর অনুমোদন নেই (repo scope চেক করুন)।`
    );
  }

  const refData = await refRes.json();
  const latestCommitSha: string = refData.object.sha;

  const commitRes = await fetch(`${apiBase}/git/commits/${latestCommitSha}`, {
    headers,
  });
  const commitData = await commitRes.json();
  const baseTreeSha: string = commitData.tree.sha;

  // এডিটরের সব ফাইল দিয়ে blob তৈরি করা
  const treeItems: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string;
  }> = [];

  for (const [filePath, content] of Object.entries(params.files)) {
    const cleanPath = filePath.replace(/^\/+/, "");
    const blobRes = await fetch(`${apiBase}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        content: toBase64Utf8(content),
        encoding: "base64",
      }),
    });
    if (!blobRes.ok) {
      throw new Error(`"${cleanPath}" ফাইলটি আপলোড করতে সমস্যা হয়েছে।`);
    }
    const blobData = await blobRes.json();
    treeItems.push({
      path: cleanPath,
      mode: "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  // নতুন Tree তৈরি
  const newTreeRes = await fetch(`${apiBase}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });
  const newTreeData = await newTreeRes.json();

  // নতুন Commit তৈরি
  const newCommitRes = await fetch(`${apiBase}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: params.commitMessage,
      tree: newTreeData.sha,
      parents: [latestCommitSha],
    }),
  });
  const newCommitData = await newCommitRes.json();

  // ব্রাঞ্চ আপডেট (Push সম্পন্ন -> GitHub Actions ট্রিগার হবে)
  const updateRefRes = await fetch(
    `${apiBase}/git/refs/heads/${encodeURIComponent(params.branch)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        sha: newCommitData.sha,
      }),
    }
  );

  if (!updateRefRes.ok) {
    throw new Error("GitHub ব্রাঞ্চে পুশ সম্পন্ন করা যায়নি।");
  }

  return { pushedCount: treeItems.length };
}
